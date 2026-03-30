import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/security/encrypt'
import { Prisma } from '@prisma/client'
import { getConnector, isRelationalConnector, isMongoConnector, isFileConnector } from '@/lib/db/router'
import type { ConnectionType, PostgresCredentials, MySQLCredentials, MongoCredentials } from '@/types/connection'

export const dynamic = 'force-dynamic'

export async function POST(
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

    if (!membership) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const connection = await prisma.dataConnection.findFirst({
      where: { id: params.id, workspaceId },
    })

    if (!connection) {
      return NextResponse.json({ error: 'Connection not found' }, { status: 404 })
    }

    const connType = connection.type as ConnectionType
    const connector = getConnector(connType)

    let testResult: { success: boolean; message: string }
    let schemaResult: Record<string, unknown> | null = null

    if (connType === 'POSTGRES' || connType === 'MYSQL') {
      const encryptedData = connection.credentials as { encrypted: string } | null
      if (!encryptedData?.encrypted) {
        return NextResponse.json(
          { error: 'Connection credentials not found' },
          { status: 400 }
        )
      }

      const decrypted = decrypt(encryptedData.encrypted)
      const creds = JSON.parse(decrypted) as PostgresCredentials | MySQLCredentials

      if (!isRelationalConnector(connector)) {
        return NextResponse.json({ error: 'Invalid connector type' }, { status: 400 })
      }

      testResult = await connector.test(creds)

      if (testResult.success) {
        try {
          const schema = await connector.introspect(creds)
          schemaResult = schema as unknown as Record<string, unknown>
        } catch (schemaError) {
          console.error('Schema introspection failed:', schemaError)
          testResult.message = 'Connection successful, but schema introspection failed'
        }
      }
    } else if (connType === 'MONGODB') {
      const encryptedData = connection.credentials as { encrypted: string } | null
      if (!encryptedData?.encrypted) {
        return NextResponse.json(
          { error: 'Connection credentials not found' },
          { status: 400 }
        )
      }

      const decrypted = decrypt(encryptedData.encrypted)
      const creds = JSON.parse(decrypted) as MongoCredentials

      if (!isMongoConnector(connector)) {
        return NextResponse.json({ error: 'Invalid connector type' }, { status: 400 })
      }

      testResult = await connector.test(creds)

      if (testResult.success) {
        try {
          const schema = await connector.introspect(creds)
          schemaResult = schema as unknown as Record<string, unknown>
        } catch (schemaError) {
          console.error('Schema introspection failed:', schemaError)
          testResult.message = 'Connection successful, but schema introspection failed'
        }
      }
    } else if (connType === 'CSV' || connType === 'EXCEL') {
      if (!connection.fileObjectKey) {
        return NextResponse.json(
          { error: 'No file associated with this connection' },
          { status: 400 }
        )
      }

      testResult = { success: true, message: 'File connection available' }
      schemaResult = connection.schemaCache as Record<string, unknown> | null
    } else {
      return NextResponse.json(
        { error: `Unsupported connection type: ${connType}` },
        { status: 400 }
      )
    }

    const updatedConnection = await prisma.dataConnection.update({
      where: { id: params.id },
      data: {
        status: testResult.success ? 'ACTIVE' : 'ERROR',
        lastTestedAt: new Date(),
        ...(schemaResult && { schemaCache: schemaResult as unknown as Prisma.InputJsonValue }),
      },
    })

    return NextResponse.json({
      testResult,
      connection: {
        id: updatedConnection.id,
        name: updatedConnection.name,
        type: updatedConnection.type,
        status: updatedConnection.status,
        lastTestedAt: updatedConnection.lastTestedAt,
      },
    })
  } catch (error) {
    console.error('Error testing connection:', error)
    return NextResponse.json(
      { error: 'Failed to test connection' },
      { status: 500 }
    )
  }
}
