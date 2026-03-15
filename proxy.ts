import { NextRequest, NextResponse } from "next/server"

/**
 * PROXY — fast cookie-only auth check, no better-auth import
 * Uses raw cookie parsing to avoid better-auth edge runtime issues
 */

const AUTH_ROUTES    = ["/login", "/sign-up"]
const PRIVATE_ROUTES = ["/dashboard", "/settings"]
const ADMIN_ROUTES   = ["/admin"]

// Read better-auth session cookie directly without importing better-auth
function getSession(request: NextRequest): boolean {
  // better-auth sets a cookie named "better-auth.session_token" or "__Secure-better-auth.session_token"
  const cookies = request.cookies
  return !!(
    cookies.get("better-auth.session_token") ||
    cookies.get("__Secure-better-auth.session_token") ||
    cookies.get("__Host-better-auth.session_token")
  )
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  const isLoggedIn = getSession(request)

  const isAuthRoute = AUTH_ROUTES.some(r => pathname.startsWith(r))
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  const isPrivateRoute = PRIVATE_ROUTES.some(r => pathname.startsWith(r))
  if (isPrivateRoute && !isLoggedIn) {
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  const isAdminRoute = ADMIN_ROUTES.some(r => pathname.startsWith(r))
  if (isAdminRoute && !isLoggedIn) {
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
}
