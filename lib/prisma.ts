import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: [/*'query', */'info', 'warn', 'error'],
    datasources: process.env.USE_DIRECT_PRISMA === '1' && process.env.DIRECT_URL
      ? { db: { url: process.env.DIRECT_URL } }
      : undefined
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma