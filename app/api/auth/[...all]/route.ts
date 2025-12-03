import { auth } from '@/lib/auth'
import { toNextJsHandler } from 'better-auth/next-js'

// Forcer le runtime Node.js pour garantir que les binaires Prisma sont disponibles
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export const { GET, POST } = toNextJsHandler(auth.handler)



