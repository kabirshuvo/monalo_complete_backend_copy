import { PrismaClient } from '@prisma/client'
import { logger } from './logger'

/**
 * Set up graceful Prisma client shutdown with signal handlers
 * Prevents connection leaks in production and serverless environments
 * @param prisma - PrismaClient instance
 * @param options - Configuration options
 */
export function setupPrismaShutdown(
  prisma: PrismaClient,
  options: {
    onShutdown?: () => Promise<void> | void
    logger?: { log: (msg: string) => void; error: (msg: string) => void }
  } = {}
) {
  const loggerImpl = options.logger || {
    log: (msg: string) => logger.info(msg),
    error: (msg: string) => logger.error(msg),
  }

  const shutdown = async (signal: string) => {
    loggerImpl.log(`\n🛑 Received ${signal}, shutting down gracefully...`)

    try {
      // Run custom cleanup if provided
      if (options.onShutdown) {
        await options.onShutdown()
      }

      // Disconnect Prisma
      await prisma.$disconnect()
      loggerImpl.log('✓ Prisma disconnected successfully')
      process.exit(0)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error'
      loggerImpl.error(`✗ Error during shutdown: ${message}`)
      process.exit(1)
    }
  }

  // Handle termination signals
  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))

  // Handle uncaught exceptions
  process.on('uncaughtException', async (err: Error) => {
    loggerImpl.error(`✗ Uncaught Exception: ${err.message}`)
    loggerImpl.error(err.stack || '')
    await shutdown('uncaughtException')
  })

  // Handle unhandled promise rejections
  process.on('unhandledRejection', async (reason: unknown) => {
    const message = reason instanceof Error ? reason.message : String(reason)
    loggerImpl.error(`✗ Unhandled Rejection: ${message}`)
    await shutdown('unhandledRejection')
  })
}

/**
 * Gracefully disconnect Prisma client
 * @param prisma - PrismaClient instance
 */
export async function disconnectPrisma(prisma: PrismaClient): Promise<void> {
  try {
    await prisma.$disconnect()
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    logger.error(`Error disconnecting Prisma: ${message}`)
    throw err
  }
}
