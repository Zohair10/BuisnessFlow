import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const token = await getToken({ req, secret: process.env.AUTH_SECRET })
  const isLoggedIn = !!token

  const isAuthRoute = pathname === "/login" || pathname === "/signup"
  const isApiAuthRoute = pathname.startsWith("/api/auth")
  const isApiRoute = pathname.startsWith("/api")

  // Allow auth API routes through (OAuth callbacks, etc.)
  if (isApiAuthRoute) {
    return NextResponse.next()
  }

  // Let root/auth routes handle their own redirects so landing stays on /login.
  if (pathname === "/" || isAuthRoute) {
    return NextResponse.next()
  }

  // Protect API routes
  if (isApiRoute && !isLoggedIn) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 })
  }

  // Protect dashboard routes
  const isDashboardRoute = pathname.startsWith("/chat") || 
                          pathname.startsWith("/connections") || 
                          pathname.startsWith("/history") || 
                          pathname.startsWith("/settings")
  
  if (isDashboardRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
}
