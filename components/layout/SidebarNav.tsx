"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  MessageSquare,
  Clock,
  Database,
  Settings,
  ChevronLeft,
  Menu,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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

        {/* Collapse toggle */}
        <div className="border-t border-sidebar-border p-3">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-8 w-8 text-sidebar-foreground/50 hover:text-sidebar-foreground hover:bg-sidebar-accent",
              !collapsed && "ml-auto"
            )}
            onClick={onToggleCollapse}
          >
            {collapsed ? (
              <Menu className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      </aside>
    </TooltipProvider>
  )
}

export { SidebarNav }
