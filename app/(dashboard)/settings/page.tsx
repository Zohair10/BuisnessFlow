"use client"

import * as React from "react"
import { useSession } from "next-auth/react"
import {
  User,
  Building2,
  CreditCard,
  Mail,
  KeyRound,
  Plus,
  Shield,
  Crown,
  ArrowUpRight,
  Zap,
  BarChart3,
  Database,
  Trash2,
  Copy,
  Loader2,
} from "lucide-react"
import { toast } from "sonner"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Member {
  id: string
  name: string
  email: string
  role: "OWNER" | "ADMIN" | "MEMBER"
  avatarUrl?: string
  joinedAt: string
}

interface WorkspaceData {
  id: string
  name: string
  slug: string
  plan: string
  members: Member[]
}

const roleColors: Record<string, string> = {
  OWNER: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  ADMIN: "bg-primary/15 text-primary border-primary/25",
  MEMBER: "bg-secondary text-secondary-foreground border-border",
}

const roleIcons: Record<string, React.ElementType> = {
  OWNER: Crown,
  ADMIN: Shield,
  MEMBER: User,
}

function ProfileTab() {
  const { data: session, update: updateSession } = useSession()
  const [name, setName] = React.useState("")
  const [email, setEmail] = React.useState("")
  const [currentPassword, setCurrentPassword] = React.useState("")
  const [newPassword, setNewPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    if (session?.user) {
      setName(session.user.name ?? "")
      setEmail(session.user.email ?? "")
    }
  }, [session])

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update profile")
      }
      await updateSession()
      toast.success("Profile updated successfully")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update profile")
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to change password")
      }
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast.success("Password changed successfully")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to change password")
    } finally {
      setSaving(false)
    }
  }

  if (!session?.user) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  const userInitials = (session.user.name ?? session.user.email ?? "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className="space-y-8">
      {/* Profile Info */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Profile Information</CardTitle>
          <CardDescription>
            Update your personal details and profile picture.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={session.user.image ?? undefined} />
              <AvatarFallback className="bg-primary/15 text-xl text-primary">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Button variant="outline" size="sm">
                Upload Photo
              </Button>
              <p className="text-xs text-muted-foreground">
                JPG, PNG or GIF. Max 2MB.
              </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="profile-name">Full Name</Label>
              <Input
                id="profile-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profile-email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="profile-email"
                  value={email}
                  disabled
                  className="pl-10 opacity-60"
                />
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t border-border pt-6">
          <Button onClick={handleSaveProfile} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardFooter>
      </Card>

      {/* Change Password */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Change Password</CardTitle>
          <CardDescription>
            Ensure your account is using a strong password.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter current password"
                className="pl-10"
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat new password"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t border-border pt-6">
          <Button onClick={handleChangePassword} disabled={saving}>
            {saving ? "Changing..." : "Change Password"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}

function WorkspaceTab() {
  const { data: session } = useSession()
  const [workspace, setWorkspace] = React.useState<WorkspaceData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [workspaceName, setWorkspaceName] = React.useState("")
  const [inviteEmail, setInviteEmail] = React.useState("")
  const [inviteRole, setInviteRole] = React.useState("MEMBER")
  const [inviteDialogOpen, setInviteDialogOpen] = React.useState(false)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    fetch("/api/workspace")
      .then((res) => res.json())
      .then((data) => {
        setWorkspace(data)
        setWorkspaceName(data.name)
      })
      .catch(() => toast.error("Failed to load workspace"))
      .finally(() => setLoading(false))
  }, [])

  const currentUserRole = workspace?.members.find(
    (m) => m.email === session?.user?.email
  )?.role

  const canManage = currentUserRole === "OWNER" || currentUserRole === "ADMIN"

  const handleSaveWorkspace = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/workspace", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: workspaceName }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to update workspace")
      }
      const updated = await res.json()
      setWorkspace((prev) => (prev ? { ...prev, name: updated.name } : prev))
      toast.success("Workspace name updated")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update workspace")
    } finally {
      setSaving(false)
    }
  }

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      toast.error("Please enter an email address")
      return
    }
    setSaving(true)
    await new Promise((resolve) => setTimeout(resolve, 800))
    setSaving(false)
    setInviteEmail("")
    setInviteDialogOpen(false)
    toast.success(`Invitation sent to ${inviteEmail}`)
  }

  const handleCopyInviteLink = () => {
    const link = `${window.location.origin}/invite/${workspace?.slug ?? "ws"}`
    navigator.clipboard.writeText(link)
    toast.success("Invite link copied to clipboard")
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    )
  }

  if (!workspace) return null

  return (
    <div className="space-y-8">
      {/* Workspace Settings */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5 text-primary" />
            Workspace Settings
          </CardTitle>
          <CardDescription>
            Manage your workspace name and general preferences.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Workspace Name</Label>
            <Input
              id="workspace-name"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="Enter workspace name"
              disabled={!canManage}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Email Notifications</Label>
              <p className="text-xs text-muted-foreground">
                Receive email alerts for query errors and member activity.
              </p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border p-4">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Strict Privacy Mode</Label>
              <p className="text-xs text-muted-foreground">
                Never send raw row data to the AI model. Summaries use aggregates
                only.
              </p>
            </div>
            <Switch />
          </div>
        </CardContent>
        {canManage && (
          <CardFooter className="border-t border-border pt-6">
            <Button onClick={handleSaveWorkspace} disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        )}
      </Card>

      {/* Members */}
      <Card className="border-border bg-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Members</CardTitle>
              <CardDescription>
                {workspace.members.length} member
                {workspace.members.length !== 1 ? "s" : ""} in this workspace.
              </CardDescription>
            </div>
            {canManage && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyInviteLink}>
                  <Copy className="mr-2 h-3.5 w-3.5" />
                  Copy Invite Link
                </Button>
                <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="mr-2 h-3.5 w-3.5" />
                      Invite Member
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Invite Team Member</DialogTitle>
                      <DialogDescription>
                        Send an invitation to join your workspace.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="invite-email">Email Address</Label>
                        <Input
                          id="invite-email"
                          type="email"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          placeholder="colleague@company.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Role</Label>
                        <Select value={inviteRole} onValueChange={setInviteRole}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="MEMBER">Member</SelectItem>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <p className="pt-2 text-xs text-muted-foreground">
                          {inviteRole === "ADMIN"
                            ? "Admins can manage connections, invite members, and view analytics."
                            : "Members can run queries, create sessions, and export results."}
                        </p>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleInviteMember} disabled={saving}>
                        {saving ? "Sending..." : "Send Invitation"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            {workspace.members.map((member, index) => {
              const RoleIcon = roleIcons[member.role]
              const initials = member.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)
              return (
                <React.Fragment key={member.id}>
                  <div className="flex items-center justify-between rounded-lg px-3 py-3 transition-colors hover:bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={member.avatarUrl} />
                        <AvatarFallback className="bg-primary/15 text-xs text-primary">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{member.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {member.email}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="outline"
                        className={cn("gap-1", roleColors[member.role])}
                      >
                        <RoleIcon className="h-3 w-3" />
                        {member.role}
                      </Badge>
                      {canManage && member.role !== "OWNER" && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() =>
                            toast.success(
                              `Removed ${member.name} from workspace`
                            )
                          }
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {index < workspace.members.length - 1 && (
                    <Separator className="opacity-50" />
                  )}
                </React.Fragment>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function BillingTab() {
  const { data: session } = useSession()
  const [workspace, setWorkspace] = React.useState<WorkspaceData | null>(null)

  React.useEffect(() => {
    fetch("/api/workspace")
      .then((res) => res.json())
      .then((data) => setWorkspace(data))
      .catch(() => {})
  }, [])

  const currentPlan = workspace?.plan ?? "FREE"
  const queryLimit = currentPlan === "PRO" ? 2000 : currentPlan === "ENTERPRISE" ? Infinity : 100
  const queriesUsed = 847
  const storageUsed = 3.2
  const storageLimit = currentPlan === "PRO" ? 10 : currentPlan === "ENTERPRISE" ? Infinity : 1
  const queryPercentage = queryLimit === Infinity ? 5 : Math.round((queriesUsed / queryLimit) * 100)
  const storagePercentage = storageLimit === Infinity ? 5 : Math.round((storageUsed / storageLimit) * 100)

  return (
    <div className="space-y-8">
      {/* Current Plan */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <CreditCard className="h-5 w-5 text-primary" />
            Current Plan
          </CardTitle>
          <CardDescription>
            Your workspace is on the{" "}
            <span className="font-medium text-foreground">{currentPlan}</span> plan.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-cyan-400">
                <Zap className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{currentPlan} Plan</h3>
                <p className="text-sm text-muted-foreground">
                  {currentPlan === "PRO"
                    ? "$49/month per workspace"
                    : currentPlan === "ENTERPRISE"
                      ? "Custom pricing"
                      : "Free forever"}
                </p>
              </div>
            </div>
            {currentPlan !== "ENTERPRISE" && (
              <Button variant="outline" className="gap-1">
                {currentPlan === "PRO" ? "Upgrade to Enterprise" : "Upgrade to Pro"}
                <ArrowUpRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Usage This Period</CardTitle>
          <CardDescription>
            Billing period: March 1 - March 31, 2026
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-3 rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Query Runs</span>
                </div>
                <span className="text-sm font-semibold">
                  {queriesUsed.toLocaleString()} /{" "}
                  {queryLimit === Infinity ? "Unlimited" : queryLimit.toLocaleString()}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    queryPercentage > 80 ? "bg-amber-500" : "bg-primary"
                  )}
                  style={{ width: `${Math.min(queryPercentage, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {queryLimit === Infinity
                  ? "Unlimited queries"
                  : `${queryLimit - queriesUsed} queries remaining this month`}
              </p>
            </div>

            <div className="space-y-3 rounded-lg border border-border p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-chart-3" />
                  <span className="text-sm font-medium">File Storage</span>
                </div>
                <span className="text-sm font-semibold">
                  {storageUsed} GB /{" "}
                  {storageLimit === Infinity ? "Unlimited" : `${storageLimit} GB`}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    storagePercentage > 80 ? "bg-amber-500" : "bg-chart-3"
                  )}
                  style={{ width: `${Math.min(storagePercentage, 100)}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {storageLimit === Infinity
                  ? "Unlimited storage"
                  : `${(storageLimit - storageUsed).toFixed(1)} GB available`}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plan Comparison */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg">Plan Comparison</CardTitle>
          <CardDescription>
            Compare features across plans to find the best fit.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Free */}
            <div className="rounded-lg border border-border p-5 space-y-4">
              <div>
                <h4 className="font-semibold">Free</h4>
                <p className="text-2xl font-bold mt-1">
                  $0<span className="text-sm font-normal text-muted-foreground">/mo</span>
                </p>
              </div>
              <Separator />
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                  100 queries/month
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                  25 MB file uploads
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                  1 connection
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                  7-day history
                </li>
              </ul>
              <Button variant="outline" className="w-full" disabled={currentPlan === "FREE"}>
                {currentPlan === "FREE" ? "Current Plan" : "Downgrade"}
              </Button>
            </div>

            {/* Pro */}
            <div
              className={cn(
                "rounded-lg p-5 space-y-4 relative",
                currentPlan === "PRO"
                  ? "border-2 border-primary/40 bg-primary/5"
                  : "border border-border"
              )}
            >
              <Badge className="absolute -top-2.5 left-4">Recommended</Badge>
              <div>
                <h4 className="font-semibold">Pro</h4>
                <p className="text-2xl font-bold mt-1">
                  $49<span className="text-sm font-normal text-muted-foreground">/mo</span>
                </p>
              </div>
              <Separator />
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-primary" />
                  2,000 queries/month
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-primary" />
                  100 MB file uploads
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-primary" />
                  10 connections
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-primary" />
                  Unlimited history
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-primary" />
                  CSV / PNG exports
                </li>
              </ul>
              <Button
                className="w-full"
                variant={currentPlan === "PRO" ? "default" : "outline"}
                disabled={currentPlan === "PRO"}
              >
                {currentPlan === "PRO" ? "Current Plan" : "Upgrade to Pro"}
              </Button>
            </div>

            {/* Enterprise */}
            <div className="rounded-lg border border-border p-5 space-y-4">
              <div>
                <h4 className="font-semibold">Enterprise</h4>
                <p className="text-2xl font-bold mt-1">
                  Custom<span className="text-sm font-normal text-muted-foreground">/mo</span>
                </p>
              </div>
              <Separator />
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                  Unlimited queries
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                  Custom file limits
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                  Unlimited connections
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                  SSO / SCIM
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                  Audit exports
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-1 w-1 rounded-full bg-muted-foreground" />
                  Priority support
                </li>
              </ul>
              <Button variant="outline" className="w-full gap-1" disabled={currentPlan === "ENTERPRISE"}>
                {currentPlan === "ENTERPRISE" ? "Current Plan" : "Contact Sales"}
                {currentPlan !== "ENTERPRISE" && <ArrowUpRight className="h-3.5 w-3.5" />}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SettingsPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account, workspace, and billing preferences.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-muted/50">
          <TabsTrigger value="profile" className="gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="workspace" className="gap-2">
            <Building2 className="h-4 w-4" />
            Workspace
          </TabsTrigger>
          <TabsTrigger value="billing" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Billing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <ProfileTab />
        </TabsContent>

        <TabsContent value="workspace">
          <WorkspaceTab />
        </TabsContent>

        <TabsContent value="billing">
          <BillingTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
