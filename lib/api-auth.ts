import { NextResponse } from 'next/server'
import { UnauthorizedError } from '@/lib/auth-helpers'

/**
 * Convertit une UnauthorizedError levée par une garde (requireAdmin, requireBackofficeUser…)
 * en réponse HTTP pour les Route Handlers : 401 si non authentifié, 403 sinon.
 * Renvoie null pour toute autre erreur (à traiter par l'appelant).
 *
 * Usage : la garde est la première instruction du try, et le catch commence par
 *   const denied = unauthorizedResponse(error); if (denied) return denied
 */
export function unauthorizedResponse(error: unknown): NextResponse | null {
    if (!(error instanceof UnauthorizedError)) return null
    const status = error.message === 'Non authentifié' ? 401 : 403
    return NextResponse.json({ error: error.message }, { status })
}
