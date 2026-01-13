/**
 * Audit Logging System for Access Control
 * 
 * Logs access attempts (both allowed and denied) for security auditing.
 * 
 * Architecture:
 * - Server-side only (never from middleware)
 * - Asynchronous and non-blocking
 * - Failure-safe (doesn't crash if logging fails)
 * - Logs to database via Prisma
 * 
 * What Gets Logged:
 * - userId: User attempting access
 * - userRole: User's role at time of attempt
 * - route: Route/resource being accessed
 * - action: What happened (DENIED_ACCESS, ROLE_INSUFFICIENT, UNAUTHORIZED, etc.)
 * - reason: Why it happened
 * - timestamp: When it happened
 * 
 * Usage:
 *   // In server component or API route
 *   import { logAccessDenied } from '@/lib/auth/audit-logs'
 *   
 *   await logAccessDenied({
 *     userId: 'user-123',
 *     userRole: 'LEARNER',
 *     route: '/dashboard/admin',
 *     reason: 'Insufficient role: LEARNER is not in [ADMIN]',
 *   })
 */

import { prisma } from '@/lib/db'
import type { RoleType } from './roles'

/**
 * Audit log entry for access control events
 */
export interface AccessLogEntry {
  userId: string
  userRole?: RoleType | string
  route: string
  reason: string
  action?: string
}

/**
 * Log denied access attempt (non-blocking)
 * 
 * This function is async but should NOT be awaited in guards.
 * Instead, call it and let it execute in the background.
 * 
 * Usage (CORRECT - non-blocking):
 *   logAccessDenied({ userId, userRole, route, reason })
 *   // Continue processing, don't wait
 * 
 * Usage (WRONG - blocks execution):
 *   await logAccessDenied({ userId, userRole, route, reason })
 *   // This blocks! Don't do this.
 */
export async function logAccessDenied(entry: AccessLogEntry): Promise<void> {
  try {
    // Fire-and-forget pattern: Log but don't wait for completion
    // This ensures logging never blocks access control decisions
    
    const logEntry = {
      id: crypto.randomUUID(),
      userId: entry.userId,
      userRole: entry.userRole as string | null,
      route: entry.route,
      reason: entry.reason,
      action: entry.action || 'DENIED_ACCESS',
      pointsEarned: 0,
      createdBy: entry.userId, // Log creator is the user attempting access
      timestamp: new Date(),
    }

    // Write to database - errors won't crash the app
    await prisma.activityLog.create({
      data: logEntry,
    })

      logger.info(`[Audit] Access denied - User: ${entry.userId}, Route: ${entry.route}`)
  } catch (error) {
    // Failure-safe: Log error but don't throw
    // This prevents broken logging from breaking security
    const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error(`[Audit] Failed to log access denial: ${message}`)
    // Don't throw - logging failure should not block the application
  }
}

/**
 * Log allowed access (for sensitive operations)
 * 
 * Useful for tracking who accessed sensitive information
 * or performed privileged operations.
 * 
 * Usage:
 *   logAccessAllowed({
 *     userId: 'user-123',
 *     userRole: 'ADMIN',
 *     route: '/dashboard/admin',
 *     reason: 'Authorized: ADMIN role has access',
 *   })
 */
export async function logAccessAllowed(entry: AccessLogEntry): Promise<void> {
  try {
    const logEntry = {
      id: crypto.randomUUID(),
      userId: entry.userId,
      userRole: entry.userRole as string | null,
      route: entry.route,
      reason: entry.reason,
      action: entry.action || 'ALLOWED_ACCESS',
      pointsEarned: 0,
      createdBy: entry.userId,
      timestamp: new Date(),
    }

    await prisma.activityLog.create({
      data: logEntry,
    })

      logger.info(`[Audit] Access allowed - User: ${entry.userId}, Route: ${entry.route}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error(`[Audit] Failed to log access allowed: ${message}`)
  }
}

/**
 * Log authentication failure
 * 
 * Tracks failed login attempts, expired sessions, missing tokens, etc.
 */
export async function logAuthFailure(entry: Omit<AccessLogEntry, 'userRole'>): Promise<void> {
  try {
    const logEntry = {
      id: crypto.randomUUID(),
      userId: entry.userId,
      userRole: null,
      route: entry.route,
      reason: entry.reason,
      action: entry.action || 'AUTH_FAILURE',
      pointsEarned: 0,
      createdBy: entry.userId,
      timestamp: new Date(),
    }

    await prisma.activityLog.create({
      data: logEntry,
    })

      logger.info(`[Audit] Auth failure - User: ${entry.userId}, Route: ${entry.route}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error(`[Audit] Failed to log auth failure: ${message}`)
  }
}

/**
 * Log role validation failure
 * 
 * Tracks when user has required role but feature is disabled,
 * permission checks fail, or other authorization issues.
 */
export async function logRoleValidationFailure(
  entry: AccessLogEntry & { requiredRoles?: string }
): Promise<void> {
  try {
    const reason = entry.requiredRoles
      ? `${entry.reason} (Required: ${entry.requiredRoles})`
      : entry.reason

    const logEntry = {
      id: crypto.randomUUID(),
      userId: entry.userId,
      userRole: entry.userRole as string | null,
      route: entry.route,
      reason,
      action: entry.action || 'ROLE_VALIDATION_FAILED',
      pointsEarned: 0,
      createdBy: entry.userId,
      timestamp: new Date(),
    }

    await prisma.activityLog.create({
      data: logEntry,
    })

      logger.info(
        `[Audit] Role validation failed - User: ${entry.userId}, Role: ${entry.userRole}`
      )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error(`[Audit] Failed to log role validation failure: ${message}`)
  }
}

/**
 * Log feature flag denial
 * 
 * Tracks when user has role but feature is disabled
 */
export async function logFeatureDenied(entry: AccessLogEntry & { feature?: string }): Promise<void> {
  try {
    const reason = entry.feature
      ? `Feature denied: ${entry.feature}. ${entry.reason}`
      : entry.reason

    const logEntry = {
      id: crypto.randomUUID(),
      userId: entry.userId,
      userRole: entry.userRole as string | null,
      route: entry.route,
      reason,
      action: entry.action || 'FEATURE_DENIED',
      pointsEarned: 0,
      createdBy: entry.userId,
      timestamp: new Date(),
    }

    await prisma.activityLog.create({
      data: logEntry,
    })

      logger.info(`[Audit] Feature denied - User: ${entry.userId}, Feature: ${entry.feature}`)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
      logger.error(`[Audit] Failed to log feature denial: ${message}`)
  }
}

/**
 * Get access denial logs for a user
 * 
 * Useful for security investigations
 * 
 * Usage:
 *   const denials = await getAccessDenialLogs('user-123', { days: 7 })
 */
export async function getAccessDenialLogs(
  userId: string,
  options?: {
    days?: number
    action?: string
    limit?: number
  }
): Promise<any[]> {
  try {
    const sinceDate = new Date()
    sinceDate.setDate(sinceDate.getDate() - (options?.days ?? 30))

    const logs = await prisma.activityLog.findMany({
      where: {
        userId: {
          equals: userId,
        },
        action: {
          equals: options?.action || 'DENIED_ACCESS',
        },
        timestamp: {
          gte: sinceDate,
        },
        deletedAt: null,
      },
      orderBy: { timestamp: 'desc' },
      take: options?.limit ?? 100,
    })

    return logs
  } catch (error) {
      logger.error('[Audit] Failed to retrieve access denial logs:', error)
    return []
  }
}

/**
 * Get access denial logs by role
 * 
 * Analyze denied access patterns across roles
 * 
 * Usage:
 *   const denials = await getAccessDenialsByRole('LEARNER', { days: 30 })
 */
export async function getAccessDenialsByRole(
  userRole: string,
  options?: {
    days?: number
    limit?: number
  }
): Promise<any[]> {
  try {
    const sinceDate = new Date()
    sinceDate.setDate(sinceDate.getDate() - (options?.days ?? 30))

    const logs = await prisma.activityLog.findMany({
      where: {
        userRole: {
          equals: userRole,
        },
        action: {
          equals: 'DENIED_ACCESS',
        },
        timestamp: {
          gte: sinceDate,
        },
        deletedAt: null,
      },
      orderBy: { timestamp: 'desc' },
      take: options?.limit ?? 100,
    })

    return logs
  } catch (error) {
      logger.error('[Audit] Failed to retrieve access denials by role:', error)
    return []
  }
}

/**
 * Get access denial logs for a specific route
 * 
 * Identify problematic routes or routes under attack
 * 
 * Usage:
 *   const denials = await getAccessDenialsByRoute('/dashboard/admin', { days: 7 })
 */
export async function getAccessDenialsByRoute(
  route: string,
  options?: {
    days?: number
    limit?: number
  }
): Promise<any[]> {
  try {
    const sinceDate = new Date()
    sinceDate.setDate(sinceDate.getDate() - (options?.days ?? 30))

    const logs = await prisma.activityLog.findMany({
      where: {
        route: {
          equals: route,
        },
        action: 'DENIED_ACCESS',
        timestamp: {
          gte: sinceDate,
        },
        deletedAt: null,
      },
      orderBy: { timestamp: 'desc' },
      take: options?.limit ?? 100,
    })

    return logs
  } catch (error) {
      logger.error('[Audit] Failed to retrieve access denials by route:', error)
    return []
  }
}

/**
 * Get access denial summary (for dashboards, alerts)
 * 
 * Aggregates denied access attempts
 * 
 * Usage:
 *   const summary = await getAccessDenialSummary({ days: 7 })
 */
export async function getAccessDenialSummary(options?: {
  days?: number
}): Promise<{
  totalDenials: number
  denialsByRole: Record<string, number>
  denialsByRoute: Record<string, number>
  topDeniedRoutes: Array<{ route: string; count: number }>
  topDeniedRoles: Array<{ role: string; count: number }>
}> {
  try {
    const sinceDate = new Date()
    sinceDate.setDate(sinceDate.getDate() - (options?.days ?? 30))

    // Get all denials
    const denials = await prisma.activityLog.findMany({
      where: {
        action: 'DENIED_ACCESS',
        timestamp: {
          gte: sinceDate,
        },
        deletedAt: null,
      },
    })

    const totalDenials = denials.length

    // Group by role
    const denialsByRole: Record<string, number> = {}
    denials.forEach(log => {
      const role = log.userRole || 'UNKNOWN'
      denialsByRole[role] = (denialsByRole[role] || 0) + 1
    })

    // Group by route
    const denialsByRoute: Record<string, number> = {}
    denials.forEach(log => {
      const route = log.route || 'UNKNOWN'
      denialsByRoute[route] = (denialsByRoute[route] || 0) + 1
    })

    // Top routes
    const topDeniedRoutes = Object.entries(denialsByRoute)
      .map(([route, count]) => ({ route, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    // Top roles
    const topDeniedRoles = Object.entries(denialsByRole)
      .map(([role, count]) => ({ role, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      totalDenials,
      denialsByRole,
      denialsByRoute,
      topDeniedRoutes,
      topDeniedRoles,
    }
  } catch (error) {
      logger.error('[Audit] Failed to generate access denial summary:', error)
    return {
      totalDenials: 0,
      denialsByRole: {},
      denialsByRoute: {},
      topDeniedRoutes: [],
      topDeniedRoles: [],
    }
  }
}
