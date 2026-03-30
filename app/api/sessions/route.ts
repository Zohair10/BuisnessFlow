import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const memberships = await prisma.workspaceMember.findMany({
      where: { userId: session.user.id },
      select: { workspaceId: true },
    })

    const workspaceIds = memberships.map((m) => m.workspaceId)

    if (workspaceIds.length === 0) {
      return NextResponse.json({ sessions: [] })
    }

    const sessions = await prisma.querySession.findMany({
      where: {
        workspaceId: { in: workspaceIds },
        userId: session.user.id,
      },
      include: {
        connection: {
          select: {
            name: true,
            type: true,
          },
        },
        messages: {
          select: { id: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    })

    const formatted = sessions.map((s) => ({
      id: s.id,
      workspaceId: s.workspaceId,
      userId: s.userId,
      connectionId: s.connectionId,
      title: s.title,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
      connectionName: s.connection.name,
      messageCount: s.messages.length,
    }))

    return NextResponse.json({ sessions: formatted })
  } catch (error) {
    console.error('[Sessions API] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { connectionId, title } = body as {
      connectionId: string
      title?: string
    }

    if (!connectionId) {
      return NextResponse.json(
        { error: 'connectionId is required' },
        { status: 400 }
      )
    }

    const connection = await prisma.dataConnection.findFirst({
      where: {
        id: connectionId,
        workspace: {
          members: { some: { userId: session.user.id } },
        },
      },
    })

    if (!connection) {
      return NextResponse.json(
        { error: 'Connection not found or access denied' },
        { status: 403 }
      )
    }

    if (connection.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Connection is not active' },
        { status: 400 }
      )
    }

    const membership = await prisma.workspaceMember.findFirst({
      where: {
        userId: session.user.id,
        workspaceId: connection.workspaceId,
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Not a member of this workspace' },
        { status: 403 }
      )
    }

    const newSession = await prisma.querySession.create({
      data: {
        workspaceId: connection.workspaceId,
        userId: session.user.id,
        connectionId,
        title: title || null,
      },
      include: {
        connection: {
          select: { name: true, type: true },
        },
      },
    })

    return NextResponse.json({
      session: {
        id: newSession.id,
        workspaceId: newSession.workspaceId,
        userId: newSession.userId,
        connectionId: newSession.connectionId,
        title: newSession.title,
        createdAt: newSession.createdAt.toISOString(),
        updatedAt: newSession.updatedAt.toISOString(),
        connectionName: newSession.connection.name,
      },
    })
  } catch (error) {
    console.error('[Sessions API] POST error:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}
