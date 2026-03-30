import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionId = params.id

    const querySession = await prisma.querySession.findUnique({
      where: { id: sessionId },
      include: {
        connection: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
          },
        },
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    })

    if (!querySession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    const membership = await prisma.workspaceMember.findFirst({
      where: {
        userId: session.user.id,
        workspaceId: querySession.workspaceId,
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    const formattedMessages = querySession.messages.map((msg) => ({
      id: msg.id,
      sessionId: msg.sessionId,
      role: msg.role,
      content: msg.content,
      createdAt: msg.createdAt.toISOString(),
    }))

    return NextResponse.json({
      session: {
        id: querySession.id,
        workspaceId: querySession.workspaceId,
        userId: querySession.userId,
        connectionId: querySession.connectionId,
        title: querySession.title,
        createdAt: querySession.createdAt.toISOString(),
        updatedAt: querySession.updatedAt.toISOString(),
        connection: querySession.connection,
      },
      messages: formattedMessages,
    })
  } catch (error) {
    console.error('[Session API] GET error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sessionId = params.id

    const querySession = await prisma.querySession.findUnique({
      where: { id: sessionId },
      select: {
        id: true,
        workspaceId: true,
        userId: true,
      },
    })

    if (!querySession) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    const membership = await prisma.workspaceMember.findFirst({
      where: {
        userId: session.user.id,
        workspaceId: querySession.workspaceId,
      },
    })

    if (!membership) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    if (
      querySession.userId !== session.user.id &&
      membership.role !== 'OWNER' &&
      membership.role !== 'ADMIN'
    ) {
      return NextResponse.json(
        { error: 'Only the session owner or workspace admin can delete this session' },
        { status: 403 }
      )
    }

    await prisma.querySession.delete({
      where: { id: sessionId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[Session API] DELETE error:', error)
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    )
  }
}
