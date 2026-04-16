"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession, signOut } from "next-auth/react"
import {
  MessageSquare,
  Clock,
  Database,
  Settings,
  ChevronLeft,
  Menu,
  LogOut,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

interface NavItem {
  label: string
  href: string
  icon: React.ElementType
  section: string
}

const navItems: NavItem[] = [
  { label: "Chat", href: "/chat", icon: MessageSquare, section: "Analytics" },
  { label: "History", href: "/history", icon: Clock, section: "Analytics" },
  { label: "Connections", href: "/connections", icon: Database, section: "Data" },
  { label: "Settings", href: "/settings", icon: Settings, section: "Manage" },
]

const sectionOrder = ["Analytics", "Data", "Manage"]

interface SidebarNavProps {
  collapsed?: boolean
  onToggleCollapse?: () => void
}

function SidebarNav({ collapsed = false, onToggleCollapse }: SidebarNavProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [loggingOut, setLoggingOut] = React.useState(false)

  const userInitials = (session?.user?.name ?? session?.user?.email ?? "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  const handleLogout = React.useCallback(async () => {
    setLoggingOut(true)
    await signOut({ redirect: false })
    window.location.href = "/login"
  }, [])

  const groupedItems = sectionOrder.map((section) => ({
    section,
    items: navItems.filter((item) => item.section === section),
  }))

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-screen flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300 ease-in-out",
          collapsed ? "w-[68px]" : "w-[240px]"
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex h-16 items-center border-b border-sidebar-border px-4",
            collapsed ? "justify-center" : "gap-3"
          )}
        >
          <img src="/logo.jpg" alt="Buisness Flow" className="h-8 w-8 shrink-0 rounded-lg object-cover" />
          {!collapsed && (
            <div className="flex flex-col overflow-hidden">
              <span className="truncate text-sm font-semibold text-sidebar-foreground">
                Buisness Flow
              </span>
              <span className="truncate text-[11px] text-muted-foreground">
                Analytics
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto overflow-x-hidden scrollbar-thin px-3 py-4">
          {groupedItems.map((group, groupIndex) => (
            <div key={group.section} className={cn(groupIndex > 0 && "mt-6")}>
              {!collapsed && (
                <h4 className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {group.section}
                </h4>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    pathname.startsWith(item.href + "/")
                  const Icon = item.icon

                  const linkContent = (
                    <Link
                      href={item.href}
                      className={cn(
                        "group flex items-center rounded-md text-sm font-medium transition-all duration-150",
                        collapsed
                          ? "justify-center px-2 py-2.5"
                          : "gap-3 px-3 py-2",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-primary"
                          : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                      )}
                    >
                      <Icon
                        className={cn(
                          "h-4 w-4 shrink-0 transition-colors",
                          isActive
                            ? "text-sidebar-primary"
                            : "text-sidebar-foreground/50 group-hover:text-sidebar-foreground/80"
                        )}
                      />
                      {!collapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                      {isActive && (
                        <div
                          className={cn(
                            "absolute left-0 h-5 w-[3px] rounded-r-full bg-sidebar-primary transition-all",
                            collapsed ? "left-0" : "left-0"
                          )}
                        />
                      )}
                    </Link>
                  )

                  if (collapsed) {
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                        <TooltipContent side="right" className="font-medium">
                          {item.label}
                        </TooltipContent>
                      </Tooltip>
                    )
                  }

                  return (
                    <React.Fragment key={item.href}>
                      {linkContent}
                    </React.Fragment>
                  )
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* User section + collapse toggle */}
        <div className="border-t border-sidebar-border p-3">
          {collapsed ? (
            <div className="flex flex-col items-center gap-2">
              <TooltipProvider delayDuration={0}>
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
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                      onClick={onToggleCollapse}
                    >
                      <Menu className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">Expand</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          ) : (
            <div className="space-y-3">
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
              <div className="flex justify-end">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent"
                  onClick={onToggleCollapse}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </TooltipProvider>
  )
}

export { SidebarNav }
