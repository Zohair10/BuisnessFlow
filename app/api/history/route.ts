import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import type { QueryRunStatus } from '@prisma/client'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
    const pageSize = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get('pageSize') || '20', 10))
    )
    const connectionId = searchParams.get('connectionId') || undefined
    const statusFilter = searchParams.get('status') || undefined
    const search = searchParams.get('search') || undefined

    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: session.user.id },
      select: { workspaceId: true },
    })

    const workspaceIds = memberships.map((m) => m.workspaceId)

    if (workspaceIds.length === 0) {
      return NextResponse.json({ entries: [], total: 0, page, pageSize })
    }

    const whereClause: Prisma.QueryRunWhereInput = {
      workspaceId: { in: workspaceIds },
      userId: session.user.id,
    }

    if (connectionId) {
      whereClause.connectionId = connectionId
    }
    if (statusFilter) {
      whereClause.status = statusFilter.toUpperCase() as QueryRunStatus
    }
    if (search) {
      whereClause.question = { contains: search, mode: 'insensitive' }
    }

    const [entries, total] = await Promise.all([
      prisma.queryRun.findMany({
        where: whereClause,
        include: {
          connection: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.queryRun.count({ where: whereClause }),
    ])

    const formatted = entries.map((entry) => ({
      id: entry.id,
      question: entry.question,
      compiledQuery: entry.compiledQuery,
      responseKind: entry.responseKind,
      chartSubtype: entry.chartSubtype,
      rowCount: entry.rowCount,
      durationMs: entry.durationMs,
      status: entry.status,
      errorCode: entry.errorCode,
      errorMessage: entry.errorMessage,
      createdAt: entry.createdAt.toISOString(),
      connectionName: entry.connection.name,
    }))

    return NextResponse.json({
      entries: formatted,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    })
  } catch (error) {
    console.error('[History API] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch query history' },
      { status: 500 }
    )
  }
}
