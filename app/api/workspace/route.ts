import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id || !session.user.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const workspace = await prisma.workspace.findUnique({
    where: { id: session.user.workspaceId },
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
      createdAt: true,
      members: {
        select: {
          id: true,
          role: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  })

  if (!workspace) {
    return NextResponse.json(
      { error: "Workspace not found" },
      { status: 404 }
    )
  }

  const members = workspace.members.map((m) => ({
    id: m.id,
    name: m.user.name ?? "Unnamed",
    email: m.user.email,
    avatarUrl: m.user.image,
    role: m.role,
    joinedAt: m.createdAt.toISOString(),
  }))

  return NextResponse.json({
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    plan: workspace.plan,
    createdAt: workspace.createdAt,
    members,
  })
}

export async function PATCH(request: Request) {
  const session = await auth()
  if (!session?.user?.id || !session.user.workspaceId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // Check user is OWNER or ADMIN
  const membership = await prisma.workspaceMember.findUnique({
    where: {
      workspaceId_userId: {
        workspaceId: session.user.workspaceId,
        userId: session.user.id,
      },
    },
    select: { role: true },
  })

  if (!membership || membership.role === "MEMBER") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const body = await request.json()
  const { name } = body

  const updated = await prisma.workspace.update({
    where: { id: session.user.workspaceId },
    data: {
      ...(name !== undefined && { name }),
    },
    select: {
      id: true,
      name: true,
      slug: true,
      plan: true,
    },
  })

  return NextResponse.json(updated)
}
