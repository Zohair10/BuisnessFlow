"use client"

import * as React from "react"
import { useSession, signOut } from "next-auth/react"
import { SidebarNav } from "@/components/layout/SidebarNav"
import { WorkspaceSwitcher } from "@/components/layout/WorkspaceSwitcher"
import { cn } from "@/lib/utils"
import { LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = React.useState(false)
  const { data: session } = useSession()
  const [loggingOut, setLoggingOut] = React.useState(false)

  const handleLogout = React.useCallback(async () => {
    setLoggingOut(true)
    // Use redirect:false then hard navigate to ensure cookies are fully cleared
    await signOut({ redirect: false })
    window.location.href = "/login"
  }, [])

  const userInitials = (session?.user?.name ?? session?.user?.email ?? "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const sidebarWidth = collapsed ? "w-[68px]" : "w-[240px]"

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 z-40 flex flex-col">
        <div className="flex flex-1 flex-col">
          <SidebarNav
            collapsed={collapsed}
            onToggleCollapse={() => setCollapsed(!collapsed)}
          />
        </div>

        {/* User section at bottom of sidebar */}
        <div className={cn(
          "border-t border-sidebar-border p-3 transition-all duration-300",
          sidebarWidth
        )}>
          {collapsed ? (
            <TooltipProvider delayDuration={0}>
              <div className="flex flex-col items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/20 text-[11px] text-primary">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="font-medium">{session?.user?.name ?? "User"}</p>
                    <p className="text-xs text-muted-foreground">{session?.user?.email}</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-sidebar-foreground/50 hover:text-destructive hover:bg-sidebar-accent"
                      onClick={handleLogout}
                      disabled={loggingOut}
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Log out</TooltipContent>
                </Tooltip>
              </div>
            </TooltipProvider>
          ) : (
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarFallback className="bg-primary/20 text-[11px] text-primary">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-sidebar-foreground">
                  {session?.user?.name ?? "User"}
                </p>
                <p className="truncate text-[11px] text-muted-foreground">
                  {session?.user?.email}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 text-sidebar-foreground/50 hover:text-destructive hover:bg-sidebar-accent"
                onClick={handleLogout}
                disabled={loggingOut}
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <main
        className={cn(
          "min-h-screen transition-all duration-300 ease-in-out",
          collapsed ? "pl-[68px]" : "pl-[240px]"
        )}
      >
        <div className="mx-auto max-w-[1400px] p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
