import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

const cookieName = process.env.VERCEL === "1"
  ? "__Secure-next-auth.session-token"
  : "next-auth.session-token"

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const token = await getToken({ req, secret: process.env.AUTH_SECRET, cookieName })
  const isLoggedIn = !!token

  const isAuthRoute = pathname === "/login" || pathname === "/signup"
  const isApiAuthRoute = pathname.startsWith("/api/auth")
  const isApiRoute = pathname.startsWith("/api")

  // Allow auth API routes through (OAuth callbacks, etc.)
  if (isApiAuthRoute) {
    return NextResponse.next()
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/chat", req.nextUrl))
  }

  // Let root route handle its own logic
  if (pathname === "/") {
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
