import { NextRequest, NextResponse } from "next/server"
import { getSessionCookie } from "better-auth/cookies"

/**
 * PROXY (was middleware in Next.js <16)
 *
 * LAYER 1 of auth protection — fast, cookie-only check.
 * Just checks if a session cookie EXISTS, no DB call.
 *
 * This handles:
 *   ✅ Redirect logged-out users away from /dashboard, /settings
 *   ✅ Redirect logged-in users away from /login, /sign-up
 *   ✅ Block non-logged-in users from /admin (role check happens in the page)
 *
 * NOT handled here (done in page/layout instead):
 *   ❌ Is the session actually valid? (needs DB)
 *   ❌ Is the user actually an admin? (needs DB)
 */

const AUTH_ROUTES    = ["/login", "/sign-up"]   // logged-out users only
const PRIVATE_ROUTES = ["/dashboard", "/settings"] // must be logged in
const ADMIN_ROUTES   = ["/admin"]               // must be logged in (role checked in page)

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Always allow: API routes, static files ────────────────────────────
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next/") ||
    pathname.includes(".")
  ) {
    return NextResponse.next()
  }

  // ── Read session cookie (Better Auth official method) ─────────────────
  //
  // getSessionCookie() reads the cookie Better Auth set at login.
  // It returns the cookie value if it exists, null if not.
  // This does NOT verify the session with the database — just checks existence.
  const session = getSessionCookie(request)
  const isLoggedIn = !!session

  // ── Auth routes: /login, /sign-up ─────────────────────────────────────
  // If already logged in, no need to see these pages
  const isAuthRoute = AUTH_ROUTES.some(r => pathname.startsWith(r))
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }

  // ── Private routes: /dashboard, /settings ─────────────────────────────
  const isPrivateRoute = PRIVATE_ROUTES.some(r => pathname.startsWith(r))
  if (isPrivateRoute && !isLoggedIn) {
    const url = new URL("/login", request.url)
    url.searchParams.set("callbackUrl", pathname)
    return NextResponse.redirect(url)
  }

  // ── Admin routes: /admin ───────────────────────────────────────────────
  // Layer 1: must be logged in (proxy checks this)
  // Layer 2: must be admin (the /admin layout checks this with getSession)
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
