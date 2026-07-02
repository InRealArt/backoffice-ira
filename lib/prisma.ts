import { PrismaClient } from '@/src/generated/prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set')
  }

  const adapter = new PrismaNeon({ connectionString })

  return new PrismaClient({
    adapter,
    log: [/*'query', */'info', 'warn', 'error'] as ('info' | 'warn' | 'error')[],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

/**
 * Retente un appel Prisma en cas d'erreur de connexion WebSocket transitoire du driver
 * adapter Neon ("Received network error or non-101 status code"), fréquente en dev local
 * quand la connexion serverless s'est mise en veille entre deux requêtes.
 */
export async function withPrismaRetry<T>(fn: () => Promise<T>, maxAttempts = 2): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      const isConnectionError =
        error instanceof Error && /network error|non-101 status code/i.test(error.message)
      if (!isConnectionError || attempt === maxAttempts) {
        throw error
      }
    }
  }
  throw lastError
}
