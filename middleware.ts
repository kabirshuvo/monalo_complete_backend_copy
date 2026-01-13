/**
 * Next.js Middleware for Authentication-Only Protection
 * 
 * SECURITY HARDENING: Middleware performs AUTHENTICATION checks only,
 * NOT authorization checks. Role validation is deferred to server-side guards.
 * 
 * This prevents role spoofing attacks where attackers modify JWT claims.
 * Even if an attacker changes their role in the JWT, they cannot access
 * protected resources because server-side guards re-validate the role.
 * 
 * Middleware Responsibilities (COARSE):
 * - ✅ Check if user is authenticated (token exists & is valid)
 * - ✅ Check if route requires authentication
 * - ✅ Redirect unauthenticated users to /login
 * 
 * Server-Side Responsibilities (FINE):
 * - ✅ Validate user role via requireServerRole() (pages)
 * - ✅ Validate user role via requireRole() (API routes)
 * - ✅ Validate permissions via hasPermission() (fine-grained)
 * - ✅ Fetch role from database (never trust JWT claim alone)
 * 
 * Protection Flow:
 * Middleware: Is user authenticated? → Yes, allow through
 *                                  → No, redirect to /login
 *     ↓↓↓
 * Server: Does user have required role? → Yes, render page
 *                                      → No, redirect to /403
 * 
 * This two-layer approach ensures:
 * - Fast edge-level authentication check
 * - Authoritative server-side role validation
 * - Defense against JWT claim manipulation
 */

import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'
import type { JWT } from 'next-auth/jwt'

/**
 * Type for the decoded JWT token
 * NOTE: We do NOT trust the role claim in middleware
 * It will be re-validated server-side
 */
interface TokenWithRole extends JWT {
  role?: string
  sub?: string
}

/**
 * Middleware function that runs on protected routes
 * 
 * AUTHENTICATION-ONLY: Checks if user is authenticated,
 * but does NOT check if user has required role.
 * 
 * Role validation happens server-side in:
 * - pages: await requireServerRole('ADMIN')
 * - API routes: await requireRole('ADMIN')
 */
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Get the token from cookies using NEXTAUTH_SECRET
  // This is edge-compatible and works in Vercel Edge Runtime
  const token = (await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  })) as TokenWithRole | null

  /**
   * AUTHENTICATION CHECK ONLY
   * We verify the token exists and is cryptographically valid
   * but we do NOT check the role claim
   */
  if (!token) {
    // User is not authenticated
    // Save the requested URL to redirect back after login
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('callbackUrl', pathname)
    
    logger.info(`[Middleware] Unauthenticated access to ${pathname}, redirecting to login`)
    return NextResponse.redirect(loginUrl)
  }

  /**
   * User is authenticated (token is valid)
   * Allow request to proceed to server-side guards
   * 
   * The server component (page.tsx) will:
   * 1. Extract session via getServerSession()
   * 2. Call requireServerRole() to validate role
   * 3. Fetch role from database (never trust JWT alone)
   * 4. Redirect to /403 if role insufficient
   * 
   * This ensures role cannot be spoofed via JWT manipulation
   */
  logger.info(`[Middleware] Authenticated request to ${pathname}, user: ${token.sub}`)
  return NextResponse.next()
}

/**
 * Matcher configuration for the middleware
 * 
 * The matcher array defines which routes trigger the middleware.
 * Using matcher is more efficient than checking pathname in the middleware function
 * because it prevents unnecessary middleware execution on routes that don't need protection.
 * 
 * Middleware Role: AUTHENTICATION ONLY
 * These routes require the user to be logged in, but role validation
 * happens server-side via requireServerRole() or requireRole()
 * 
 * Automatically excluded (by Next.js default):
 * - Static files: /public/* (images, css, js, etc)
 * - API routes: /api/*
 * - Next.js internals: /_next/*, /_vercel/*, etc
 * - favicon, robots.txt, sitemap.xml
 * 
 * Patterns:
 * - '/path' → Exact match
 * - '/path/:param' → Route with parameter
 * - '/path/:param*' → Route and all sub-routes (catch-all)
 * 
 * Performance Note:
 * The middleware function runs very quickly (edge runtime), but matcher ensures
 * we only execute it when necessary. This is especially important for:
 * - Static assets (CSS, images, fonts)
 * - API requests
 * - Public pages (no protection needed)
 */
export const config = {
  matcher: [
    /**
     * Protect all dashboard routes with authentication check
     * 
     * /dashboard/:path* matches:
     * - /dashboard/admin (role validated server-side)
     * - /dashboard/writer (role validated server-side)
     * - /dashboard/learner (role validated server-side)
     * - /dashboard/customer (role validated server-side)
     * - Any future /dashboard/* sub-routes (role validated server-side)
     * 
     * Middleware: Checks user is authenticated
     * Server: Validates user has required role
     */
    '/dashboard/:path*',
    
    /**
     * Future protected routes can be added here:
     * 
     * '/admin/:path*'          - Admin-only pages (role check server-side)
     * '/settings/:path*'       - Account settings (auth required, role varies)
     * '/account/:path*'        - Account pages (auth required, role varies)
     * 
     * All role validation happens server-side, never at middleware
     */
  ],
}
