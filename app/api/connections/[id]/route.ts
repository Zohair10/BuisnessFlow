import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { encrypt, decrypt } from '@/lib/security/encrypt'
import { getConnector, isRelationalConnector, isMongoConnector } from '@/lib/db/router'
import type { ConnectionType, PostgresCredentials, MySQLCredentials, MongoCredentials } from '@/types/connection'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const workspaceId = session.user.workspaceId
    if (!workspaceId) {
      return NextResponse.json({ error: 'No active workspace' }, { status: 400 })
    }

    const connection = await prisma.dataConnection.findFirst({
      where: { id: params.id, workspaceId },
      select: {
        id: true,
        workspaceId: true,
        name: true,
        type: true,
        status: true,
        schemaCache: true,
        glossaryCache: true,
        fileObjectKey: true,
        fileSizeBytes: true,
        lastTestedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    return NextResponse.json({ connection })
  } catch (error) {
    console.error('Error getting connection:', error)
    return NextResponse.json(
      { error: 'Failed to get connection' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { error: 'Only workspace owners and admins can update connections' },
        { status: 403 }
      )
    }

    const existing = await prisma.dataConnection.findFirst({
      where: { id: params.id, workspaceId },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    const body = await request.json()
    const updates: Record<string, unknown> = {}

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Connection name must be a non-empty string' },
          { status: 400 }
        )
      }
      updates['name'] = body.name.trim()
    }

    if (body.credentials !== undefined) {
      const connType = existing.type as ConnectionType
      let testResult: { success: boolean; message: string }
      let schemaResult: Record<string, unknown> | null = null

      if (connType === 'POSTGRES' || connType === 'MYSQL') {
        const creds = body.credentials as PostgresCredentials | MySQLCredentials
        const connector = getConnector(connType)
        if (isRelationalConnector(connector)) {
          testResult = await connector.test(creds)
          if (testResult.success) {
            const schema = await connector.introspect(creds)
            schemaResult = schema as unknown as Record<string, unknown>
          }
        } else {
          return NextResponse.json({ error: 'Invalid connector' }, { status: 400 })
        }
      } else if (connType === 'MONGODB') {
        const creds = body.credentials as MongoCredentials
        const connector = getConnector(connType)
        if (isMongoConnector(connector)) {
          testResult = await connector.test(creds)
          if (testResult.success) {
            const schema = await connector.introspect(creds)
            schemaResult = schema as unknown as Record<string, unknown>
          }
        } else {
          return NextResponse.json({ error: 'Invalid connector' }, { status: 400 })
        }
      } else {
        return NextResponse.json(
          { error: 'Cannot update credentials for file-based connections' },
          { status: 400 }
        )
      }

      updates['credentials'] = { encrypted: encrypt(JSON.stringify(body.credentials)) }
      updates['status'] = testResult!.success ? 'ACTIVE' : 'ERROR'
      updates['lastTestedAt'] = new Date()

      if (schemaResult) {
        updates['schemaCache'] = schemaResult
      }

      if (!testResult!.success) {
        const connection = await prisma.dataConnection.update({
          where: { id: params.id },
          data: {
            credentials: updates['credentials'] as object,
            status: 'ERROR',
            lastTestedAt: new Date(),
          },
        })

        return NextResponse.json({
          connection: {
            id: connection.id,
            name: connection.name,
            type: connection.type,
            status: connection.status,
            lastTestedAt: connection.lastTestedAt,
          },
          testResult,
        })
      }
    }

    if (body.status !== undefined) {
      updates['status'] = body.status
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const connection = await prisma.dataConnection.update({
      where: { id: params.id },
      data: updates,
    })

    return NextResponse.json({
      connection: {
        id: connection.id,
        name: connection.name,
        type: connection.type,
        status: connection.status,
        lastTestedAt: connection.lastTestedAt,
        updatedAt: connection.updatedAt,
      },
    })
  } catch (error) {
    console.error('Error updating connection:', error)
    return NextResponse.json(
      { error: 'Failed to update connection' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
        { error: 'Only workspace owners and admins can delete connections' },
        { status: 403 }
      )
    }

    const existing = await prisma.dataConnection.findFirst({
      where: { id: params.id, workspaceId },
      select: { id: true, fileObjectKey: true },
    })

    if (!existing) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    if (existing.fileObjectKey) {
      try {
        const { deleteFile } = await import('@/lib/files/upload')
        await deleteFile(existing.fileObjectKey)
      } catch (deleteError) {
        console.error('Failed to delete file from storage:', deleteError)
      }
    }

    await prisma.dataConnection.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting connection:', error)
    return NextResponse.json(
      { error: 'Failed to delete connection' },
      { status: 500 }
    )
  }
}
