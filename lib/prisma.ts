import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

// Configuration Prisma avec gestion d'erreur améliorée
const prismaClientOptions = {
  log: [/*'query', */'info', 'warn', 'error'] as ('info' | 'warn' | 'error')[],
  datasources: process.env.USE_DIRECT_PRISMA === '1' && process.env.DIRECT_URL
    ? { db: { url: process.env.DIRECT_URL } }
    : undefined
}

// Initialisation avec gestion d'erreur pour éviter les crashes au démarrage
let prismaInstance: PrismaClient | null = null

function initializePrisma(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma
  }

  if (prismaInstance) {
    return prismaInstance
  }

  try {
    prismaInstance = new PrismaClient(prismaClientOptions)

    // Tester la connexion de manière asynchrone pour éviter de bloquer
    // mais ne pas faire échouer l'initialisation si les binaires ne sont pas encore disponibles
    prismaInstance.$connect().catch((error) => {
      console.error('[Prisma] ⚠️ Erreur de connexion initiale (peut être normale au démarrage):', error.message)
    })

    globalForPrisma.prisma = prismaInstance
    return prismaInstance
  } catch (error: any) {
    console.error('[Prisma] ❌ Erreur critique lors de l\'initialisation:', {
      message: error.message,
      code: error.code,
      name: error.name
    })

    // En production, on crée quand même l'instance pour éviter de planter complètement
    // L'erreur sera gérée au moment de l'utilisation
    prismaInstance = new PrismaClient(prismaClientOptions)
    globalForPrisma.prisma = prismaInstance
    return prismaInstance
  }
}

export const prisma = initializePrisma()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}