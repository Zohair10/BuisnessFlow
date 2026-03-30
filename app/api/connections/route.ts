import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/security/encrypt'
import { getConnector, isRelationalConnector, isMongoConnector } from '@/lib/db/router'
import { sanitizeSQL } from '@/lib/db/sanitize-sql'
import { sanitizePipeline } from '@/lib/db/sanitize-pipeline'
import type { ConnectionType, PostgresCredentials, MySQLCredentials, MongoCredentials } from '@/types/connection'
import { z } from 'zod'

export const dynamic = 'force-dynamic'

const postgresSchema = z.object({
  host: z.string().min(1, 'Host is required'),
  port: z.coerce.number().min(1).max(65535),
  database: z.string().min(1, 'Database is required'),
  user: z.string().min(1, 'User is required'),
  password: z.string().min(1, 'Password is required'),
  ssl: z.boolean().optional().default(false),
})

const mysqlSchema = z.object({
  host: z.string().min(1, 'Host is required'),
  port: z.coerce.number().min(1).max(65535),
  database: z.string().min(1, 'Database is required'),
  user: z.string().min(1, 'User is required'),
  password: z.string().min(1, 'Password is required'),
  ssl: z.boolean().optional().default(false),
})

const mongoSchema = z.object({
  uri: z.string().min(1, 'Connection URI is required'),
  database: z.string().min(1, 'Database name is required'),
})

const createConnectionSchema = z.object({
  name: z.string().min(1, 'Connection name is required').max(100),
  type: z.enum(['POSTGRES', 'MYSQL', 'MONGODB', 'CSV', 'EXCEL']),
  credentials: z.record(z.unknown()),
})

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workspaceId = session.user.workspaceId
    if (!workspaceId) {
      return NextResponse.json({ error: 'No active workspace' }, { status: 400 })
    }

    const membership = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: session.user.id },
    })

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const connections = await prisma.dataConnection.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        workspaceId: true,
        name: true,
        type: true,
        status: true,
        schemaCache: true,
        fileObjectKey: true,
        fileSizeBytes: true,
        lastTestedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return NextResponse.json({ connections })
  } catch (error) {
    console.error('Error listing connections:', error)
    return NextResponse.json(
      { error: 'Failed to list connections' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workspaceId = session.user.workspaceId
    if (!workspaceId) {
      return NextResponse.json({ error: 'No active workspace' }, { status: 400 })
    }

    const membership = await prisma.workspaceMember.findFirst({
      where: { workspaceId, userId: session.user.id },
      select: { role: true },
    })

    if (!membership || !['OWNER', 'ADMIN'].includes(membership.role)) {
      return NextResponse.json(
        { error: 'Only workspace owners and admins can create connections' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const parsed = createConnectionSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { name, type, credentials } = parsed.data

    let validatedCredentials: PostgresCredentials | MySQLCredentials | MongoCredentials
    let testResult: { success: boolean; message: string }
    let schemaResult: Record<string, unknown> | null = null

    if (type === 'POSTGRES') {
      validatedCredentials = postgresSchema.parse(credentials) as PostgresCredentials
      const connector = getConnector(type)
      if (isRelationalConnector(connector)) {
        testResult = await connector.test(validatedCredentials)
        if (testResult.success) {
          const schema = await connector.introspect(validatedCredentials)
          schemaResult = schema as unknown as Record<string, unknown>
        }
      } else {
        return NextResponse.json({ error: 'Invalid connector type' }, { status: 400 })
      }
    } else if (type === 'MYSQL') {
      validatedCredentials = mysqlSchema.parse(credentials) as MySQLCredentials
      const connector = getConnector(type)
      if (isRelationalConnector(connector)) {
        testResult = await connector.test(validatedCredentials)
        if (testResult.success) {
          const schema = await connector.introspect(validatedCredentials)
          schemaResult = schema as unknown as Record<string, unknown>
        }
      } else {
        return NextResponse.json({ error: 'Invalid connector type' }, { status: 400 })
      }
    } else if (type === 'MONGODB') {
      validatedCredentials = mongoSchema.parse(credentials) as MongoCredentials
      const connector = getConnector(type)
      if (isMongoConnector(connector)) {
        testResult = await connector.test(validatedCredentials)
        if (testResult.success) {
          const schema = await connector.introspect(validatedCredentials)
          schemaResult = schema as unknown as Record<string, unknown>
        }
      } else {
        return NextResponse.json({ error: 'Invalid connector type' }, { status: 400 })
      }
    } else if (type === 'CSV' || type === 'EXCEL') {
      return NextResponse.json(
        { error: 'File uploads should use the /api/upload endpoint' },
        { status: 400 }
      )
    } else {
      return NextResponse.json(
        { error: `Unsupported connection type: ${type}` },
        { status: 400 }
      )
    }

    const encryptedCredentials = encrypt(JSON.stringify(validatedCredentials))

    const connection = await prisma.dataConnection.create({
      data: {
        workspaceId,
        name,
        type: type as ConnectionType,
        credentials: { encrypted: encryptedCredentials },
        schemaCache: schemaResult as unknown as import('@prisma/client').Prisma.InputJsonValue,
        status: testResult.success ? 'ACTIVE' : 'ERROR',
        lastTestedAt: testResult.success ? new Date() : null,
      },
    })

    return NextResponse.json(
      {
        connection: {
          id: connection.id,
          name: connection.name,
          type: connection.type,
          status: connection.status,
          lastTestedAt: connection.lastTestedAt,
          createdAt: connection.createdAt,
        },
        testResult,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating connection:', error)
    return NextResponse.json(
      { error: 'Failed to create connection' },
      { status: 500 }
    )
  }
}
