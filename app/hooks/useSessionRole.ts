'use client'

import { authClient } from '@/lib/auth-client'

interface UseSessionRoleResult {
    role: string | null
    isLoading: boolean
    isLoggedIn: boolean
}

/**
 * Source unique du rôle côté client : lu directement dans la session Better Auth
 * (champ additionnel `role`, déjà présent dans le cookie de session).
 * Aucun appel réseau supplémentaire : évite les Server Actions redondantes
 * et le loader de vérification des droits.
 *
 * NB : ceci ne sert qu'à l'affichage (menus, redirections), jamais à l'autorisation.
 * Les Server Actions sensibles doivent vérifier le rôle côté serveur (ex. checkIsAdmin()).
 * Le rôle peut être décalé de `session.cookieCache.maxAge` (5 min) après un changement de rôle.
 */
export function useSessionRole(): UseSessionRoleResult {
    const { data: session, isPending } = authClient.useSession()
    const role = (session?.user as { role?: string | null } | undefined)?.role ?? null

    return {
        role,
        isLoading: isPending,
        isLoggedIn: !!session,
    }
}
