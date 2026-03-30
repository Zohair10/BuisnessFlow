import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { buildQueryPlan } from '@/lib/ai/build-query-plan'
import { compileQueryPlan } from '@/lib/ai/compile-query-plan'
import { decideFormatHeuristic, decideFormatWithAI } from '@/lib/ai/decide-format'
import { summarizeResult } from '@/lib/ai/summarize-result'
import { sanitizeSQL } from '@/lib/db/sanitize-sql'
import { sanitizePipeline } from '@/lib/db/sanitize-pipeline'
import { buildSchemaContext } from '@/lib/db/schema-retrieval'
import { getConnector, isRelationalConnector, isMongoConnector, isFileConnector } from '@/lib/db/router'
import { checkRateLimit } from '@/lib/security/rate-limit'
import { redactSensitiveColumns } from '@/lib/security/redact'
import { decrypt } from '@/lib/security/encrypt'
import { getCachedQuery, setCachedQuery } from '@/lib/cache/query-cache'
import type { QueryPlan } from '@/types/query'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const startTime = Date.now()

  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { sessionId, connectionId, question, workspaceId } = body as {
      sessionId: string
      connectionId: string
      question: string
      workspaceId?: string
    }

    if (!sessionId || !connectionId || !question) {
      return NextResponse.json(
        { error: 'Missing required fields: sessionId, connectionId, question' },
        { status: 400 }
      )
    }

    const dbSession = await prisma.querySession.findUnique({
      where: { id: sessionId },
      include: {
        workspace: {
          include: {
            members: { where: { userId: session.user.id } },
          },
        },
        connection: true,
      },
    })

    if (!dbSession || dbSession.workspace.members.length === 0) {
      return NextResponse.json(
        { error: 'Session not found or access denied' },
        { status: 403 }
      )
    }

    if (dbSession.connectionId !== connectionId) {
      return NextResponse.json(
        { error: 'Connection does not match session' },
        { status: 400 }
      )
    }

    const workspace = dbSession.workspace
    const effectiveWorkspaceId = workspace.id

    const connection = dbSession.connection
    if (connection.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Connection is not active. Please test and fix the connection.' },
        { status: 400 }
      )
    }

    const schemaVersion = connection.updatedAt?.toISOString() || 'v1'
    const privacyMode: 'standard' | 'strict' = 'standard'

    const cachedResult = await getCachedQuery(
      effectiveWorkspaceId,
      connectionId,
      question,
      schemaVersion,
      privacyMode
    )

    if (cachedResult) {
      const queryRun = await prisma.queryRun.create({
        data: {
          workspaceId: effectiveWorkspaceId,
          connectionId,
          sessionId,
          userId: session.user.id,
          question,
          compiledQuery: cachedResult.compiledQuery,
          compiledPipeline: cachedResult.compiledPipeline as any,
          responseKind:
            cachedResult.response.kind === 'text'
              ? 'TEXT'
              : cachedResult.response.kind === 'table'
                ? 'TABLE'
                : 'CHART',
          chartSubtype: cachedResult.response.chartSubtype
            ? (cachedResult.response.chartSubtype.toUpperCase() as 'BAR' | 'LINE' | 'PIE')
            : null,
          chartConfig: cachedResult.response.chartConfig as any,
          rowCount: cachedResult.meta.rowCount,
          durationMs: cachedResult.meta.durationMs,
          cacheHit: true,
          status: 'SUCCESS',
        },
      })

      await prisma.queryMessage.createMany({
        data: [
          {
            sessionId,
            role: 'USER',
            content: { type: 'query', question, queryRunId: queryRun.id },
          },
          {
            sessionId,
            role: 'ASSISTANT',
            content: {
              type: 'response',
              summary: cachedResult.response.summary,
              responseKind: cachedResult.response.kind,
              chartSubtype: cachedResult.response.chartSubtype,
              data: cachedResult.response.data as unknown as Prisma.InputJsonValue,
              chartConfig: cachedResult.response.chartConfig as unknown as Prisma.InputJsonValue,
              compiledQuery: cachedResult.compiledQuery,
            },
          },
        ],
      })

      await prisma.querySession.update({
        where: { id: sessionId },
        data: {
          title: question.length > 80 ? question.slice(0, 77) + '...' : question,
          updatedAt: new Date(),
        },
      })

      return NextResponse.json({
        queryRunId: queryRun.id,
        sessionId,
        compiledQuery: cachedResult.compiledQuery,
        compiledPipeline: cachedResult.compiledPipeline,
        response: cachedResult.response,
        meta: {
          ...cachedResult.meta,
          cacheHit: true,
        },
      })
    }

    const rateLimitResult = await checkRateLimit(effectiveWorkspaceId)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        {
          error: 'Rate limit exceeded. Please wait a moment before trying again.',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': String(rateLimitResult.limit),
            'X-RateLimit-Remaining': String(rateLimitResult.remaining),
            'X-RateLimit-Reset': String(rateLimitResult.reset),
          },
        }
      )
    }

    const schema = connection.schemaCache as Record<string, unknown> | null
    const glossary = connection.glossaryCache as string | null

    const schemaContext = buildSchemaContext(
      schema as any,
      question,
      glossary
    )

    const connectionTypeLower =
      connection.type === 'POSTGRES'
        ? 'postgres'
        : connection.type === 'MYSQL'
          ? 'mysql'
          : connection.type === 'MONGODB'
            ? 'mongodb'
            : connection.type === 'CSV'
              ? 'csv'
              : 'excel'

    const queryPlan = await buildQueryPlan({
      question,
      schema: schemaContext,
      connectionType: connectionTypeLower,
      glossary: glossary || undefined,
    })

    let compiledQuery: string | undefined
    let compiledPipeline: Record<string, unknown>[] | undefined

    if (connection.type === 'MONGODB') {
      if (queryPlan.entities.length > 0) {
        compiledPipeline = compileQueryPlan(queryPlan) as Record<string, unknown>[]
      }

      if (compiledPipeline && compiledPipeline.length > 0) {
        const sanitizeResult = sanitizePipeline(compiledPipeline)
        if (!sanitizeResult.safe) {
          await prisma.queryRun.create({
            data: {
              workspaceId: effectiveWorkspaceId,
              connectionId,
              sessionId,
              userId: session.user.id,
              question,
              queryPlan: queryPlan as any,
              status: 'BLOCKED',
              errorCode: 'PIPELINE_SAFETY_REJECTION',
              errorMessage: sanitizeResult.reason,
            },
          })

          return NextResponse.json(
            { error: 'Generated pipeline was blocked for safety reasons.' },
            { status: 400 }
          )
        }
      }
    } else {
      try {
        compiledQuery = compileQueryPlan(queryPlan) as string
      } catch (compileError) {
        await prisma.queryRun.create({
          data: {
            workspaceId: effectiveWorkspaceId,
            connectionId,
            sessionId,
            userId: session.user.id,
            question,
            queryPlan: queryPlan as any,
            status: 'FAILED',
            errorCode: 'COMPILE_ERROR',
            errorMessage:
              compileError instanceof Error
                ? compileError.message
                : 'Failed to compile query',
          },
        })

        return NextResponse.json(
          { error: 'Failed to generate a valid query for your question.' },
          { status: 400 }
        )
      }

      if (compiledQuery && !compiledQuery.includes('placeholder')) {
        const sanitizeResult = sanitizeSQL(compiledQuery)
        if (!sanitizeResult.safe) {
          await prisma.queryRun.create({
            data: {
              workspaceId: effectiveWorkspaceId,
              connectionId,
              sessionId,
              userId: session.user.id,
              question,
              queryPlan: queryPlan as any,
              compiledQuery,
              status: 'BLOCKED',
              errorCode: 'SQL_SAFETY_REJECTION',
              errorMessage: sanitizeResult.reason,
            },
          })

          return NextResponse.json(
            { error: 'Generated query was blocked for safety reasons.' },
            { status: 400 }
          )
        }
      }
    }

    let resultRows: Record<string, unknown>[] = []
    let executionDurationMs = 0

    try {
      const connector = getConnector(connection.type)

      if (isMongoConnector(connector) && compiledPipeline) {
        const creds = JSON.parse(decrypt(connection.credentials as string)) as {
          uri: string
          database: string
        }
        const collectionName = queryPlan.entities[0]
        const execResult = await connector.executePipeline(
          creds,
          collectionName,
          compiledPipeline
        )
        resultRows = execResult.docs
        executionDurationMs = execResult.durationMs
      } else if (isRelationalConnector(connector) && compiledQuery) {
        const creds = JSON.parse(decrypt(connection.credentials as string))
        const execResult = await connector.execute(creds, compiledQuery)
        resultRows = execResult.rows
        executionDurationMs = execResult.durationMs
      } else if (isFileConnector(connector) && compiledQuery) {
        if (connection.fileObjectKey) {
          const execResult = await connector.queryTempTable(compiledQuery)
          resultRows = execResult.rows
          executionDurationMs = execResult.durationMs
        }
      }
    } catch (execError) {
      const durationMs = Date.now() - startTime

      await prisma.queryRun.create({
        data: {
          workspaceId: effectiveWorkspaceId,
          connectionId,
          sessionId,
          userId: session.user.id,
          question,
          queryPlan: queryPlan as any,
          compiledQuery,
          compiledPipeline: compiledPipeline as any,
          status: 'FAILED',
          durationMs,
          errorCode: 'EXECUTION_ERROR',
          errorMessage:
            execError instanceof Error
              ? execError.message
              : 'Query execution failed',
        },
      })

      return NextResponse.json(
        {
          error: 'Query execution failed. Please check your connection and try again.',
        },
        { status: 500 }
      )
    }

    const redactedData = redactSensitiveColumns(resultRows)

    let formatDecision
    try {
      formatDecision = decideFormatHeuristic(redactedData, question)
    } catch {
      formatDecision = {
        kind: 'table' as const,
        data: redactedData,
        summary: '',
      }
    }

    let summary: string
    try {
      summary = await summarizeResult({
        data: redactedData,
        question,
        responseKind: formatDecision.kind,
        chartConfig: formatDecision.chartConfig,
      })
    } catch {
      summary = `Query returned ${redactedData.length} result${redactedData.length === 1 ? '' : 's'}.`
    }

    const totalDurationMs = Date.now() - startTime

    const response = {
      kind: formatDecision.kind,
      chartSubtype: formatDecision.chartSubtype,
      summary,
      chartConfig: formatDecision.chartConfig,
      data: redactedData,
    }

    const queryRun = await prisma.queryRun.create({
      data: {
        workspaceId: effectiveWorkspaceId,
        connectionId,
        sessionId,
        userId: session.user.id,
        question,
        queryPlan: queryPlan as any,
        compiledQuery,
        compiledPipeline: compiledPipeline as any,
        responseKind:
          formatDecision.kind === 'text'
            ? 'TEXT'
            : formatDecision.kind === 'table'
              ? 'TABLE'
              : 'CHART',
        chartSubtype: formatDecision.chartSubtype
          ? (formatDecision.chartSubtype.toUpperCase() as 'BAR' | 'LINE' | 'PIE')
          : null,
        chartConfig: formatDecision.chartConfig as any,
        rowCount: redactedData.length,
        durationMs: totalDurationMs,
        status: 'SUCCESS',
      },
    })

    await prisma.usageEvent.create({
      data: {
        workspaceId: effectiveWorkspaceId,
        queryRunId: queryRun.id,
        kind: 'QUERY_EXECUTION',
        units: 1,
      },
    })

    await prisma.queryMessage.createMany({
      data: [
        {
          sessionId,
          role: 'USER',
          content: { type: 'query', question, queryRunId: queryRun.id },
        },
        {
          sessionId,
          role: 'ASSISTANT',
          content: {
            type: 'response',
            summary,
            responseKind: response.kind,
            chartSubtype: response.chartSubtype,
            data: response.data as unknown as Prisma.InputJsonValue,
            chartConfig: response.chartConfig as unknown as Prisma.InputJsonValue,
            compiledQuery,
          },
        },
      ],
    })

    await prisma.querySession.update({
      where: { id: sessionId },
      data: {
        title: question.length > 80 ? question.slice(0, 77) + '...' : question,
        updatedAt: new Date(),
      },
    })

    await setCachedQuery(
      effectiveWorkspaceId,
      connectionId,
      question,
      schemaVersion,
      privacyMode,
      {
        response,
        meta: {
          rowCount: redactedData.length,
          durationMs: totalDurationMs,
          privacyMode,
        },
        compiledQuery,
        compiledPipeline,
      }
    )

    return NextResponse.json({
      queryRunId: queryRun.id,
      sessionId,
      compiledQuery,
      compiledPipeline,
      response,
      meta: {
        rowCount: redactedData.length,
        durationMs: totalDurationMs,
        cacheHit: false,
        privacyMode: 'standard' as const,
      },
    })
  } catch (error) {
    console.error('[Query API] Unhandled error:', error)

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred while processing your query.',
      },
      { status: 500 }
    )
  }
}
