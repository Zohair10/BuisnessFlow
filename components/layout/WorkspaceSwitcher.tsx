"use client"

import * as React from "react"
import {
  ChevronsUpDown,
  LogOut,
  Plus,
  Settings,
  Check,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { signOut } from "next-auth/react"

interface Workspace {
  id: string
  name: string
  slug: string
  plan: string
}

interface WorkspaceSwitcherProps {
  workspaces?: Workspace[]
  activeWorkspaceId?: string
  userName?: string
  userEmail?: string
  userImage?: string
  onSwitchWorkspace?: (workspaceId: string) => void
  onCreateWorkspace?: () => void
  onLogout?: () => void
  collapsed?: boolean
}

const defaultWorkspaces: Workspace[] = [
  {
    id: "ws_1",
    name: "My Workspace",
    slug: "my-workspace",
    plan: "PRO",
  },
  {
    id: "ws_2",
    name: "Marketing Team",
    slug: "marketing-team",
    plan: "FREE",
  },
]

function WorkspaceSwitcher({
  workspaces = defaultWorkspaces,
  activeWorkspaceId = "ws_1",
  userName = "John Doe",
  userEmail = "john@example.com",
  userImage,
  onSwitchWorkspace,
  onCreateWorkspace,
  onLogout,
  collapsed = false,
}: WorkspaceSwitcherProps) {
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId)
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  if (collapsed) {
    return (
      <div className="flex flex-col items-center gap-2 border-t border-sidebar-border p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-8 w-8 items-center justify-center rounded-md text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground">
              <span className="text-xs font-bold">
                {activeWorkspace?.name.slice(0, 2).toUpperCase() ?? "WS"}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side="right" align="start" className="w-56">
            <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {workspaces.map((workspace) => (
              <DropdownMenuItem
                key={workspace.id}
                onClick={() => onSwitchWorkspace?.(workspace.id)}
                className="flex items-center justify-between"
              >
                <span>{workspace.name}</span>
                {workspace.id === activeWorkspaceId && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onCreateWorkspace}>
              <Plus className="mr-2 h-4 w-4" />
              Create Workspace
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={async () => {
                await signOut({ redirect: false })
                window.location.href = "/login"
              }}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Avatar className="h-8 w-8">
          <AvatarImage src={userImage} alt={userName} />
          <AvatarFallback className="bg-primary/20 text-[11px] text-primary">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    )
  }

  return (
    <div className="border-t border-sidebar-border p-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left transition-colors hover:bg-sidebar-accent/50">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-sidebar-accent text-xs font-bold text-sidebar-foreground">
              {activeWorkspace?.name.slice(0, 2).toUpperCase() ?? "WS"}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="truncate text-sm font-medium text-sidebar-foreground">
                {activeWorkspace?.name ?? "Select Workspace"}
              </p>
              <p className="truncate text-[11px] text-muted-foreground">
                {activeWorkspace?.plan ?? "Free"} Plan
              </p>
            </div>
            <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-[220px]">
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            {workspaces.map((workspace) => (
              <DropdownMenuItem
                key={workspace.id}
                onClick={() => onSwitchWorkspace?.(workspace.id)}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-5 w-5 items-center justify-center rounded bg-sidebar-accent text-[10px] font-bold">
                    {workspace.name.slice(0, 1).toUpperCase()}
                  </div>
                  <span>{workspace.name}</span>
                </div>
                {workspace.id === activeWorkspaceId && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onCreateWorkspace}>
            <Plus className="mr-2 h-4 w-4" />
            Create Workspace
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <div className="px-2 py-1.5">
            <div className="flex items-center gap-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={userImage} alt={userName} />
                <AvatarFallback className="bg-primary/20 text-[10px] text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium">{userName}</p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {userEmail}
                </p>
              </div>
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <a href="/settings">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </a>
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={async () => {
              await signOut({ redirect: false })
              window.location.href = "/login"
            }}
            className="text-destructive focus:text-destructive"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export { WorkspaceSwitcher }
