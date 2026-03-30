"use client"

import * as React from "react"
import { signOut } from "next-auth/react"
import { SidebarNav } from "@/components/layout/SidebarNav"
import { WorkspaceSwitcher } from "@/components/layout/WorkspaceSwitcher"
import { cn } from "@/lib/utils"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = React.useState(false)

  const handleLogout = React.useCallback(async () => {
    await signOut({ callbackUrl: "/login", redirect: true })
  }, [])

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
        {/* Workspace switcher sits at the bottom of the sidebar */}
        <div
          className={cn(
            "fixed bottom-0 left-0 z-50 transition-all duration-300",
            collapsed ? "w-[68px]" : "w-[240px]"
          )}
        >
          <WorkspaceSwitcher collapsed={collapsed} onLogout={handleLogout} />
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
