import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { BackofficeUserRoles } from '@/lib/types/roles'

/**
 * Récupère la session de l'utilisateur authentifié
 * Utilise better-auth pour une validation complète côté serveur
 * 
 * @returns La session de l'utilisateur ou null si non authentifié
 */
export async function getSession() {
    return await auth.api.getSession({
        headers: await headers()
    })
}

/**
 * Récupère la session de l'utilisateur authentifié et redirige si non authentifié
 * Fonction helper pour simplifier la protection des pages
 * 
 * @param redirectTo - URL de redirection si non authentifié (défaut: '/sign-in')
 * @returns La session de l'utilisateur (ne retourne jamais null, redirige si nécessaire)
 */
export async function requireSession(redirectTo: string = '/sign-in') {
    const session = await getSession()

    if (!session?.user) {
        redirect(redirectTo)
    }

    return session
}

/**
 * Récupère l'email de l'utilisateur authentifié
 * Redirige vers /sign-in si l'utilisateur n'est pas authentifié
 * 
 * @returns L'email de l'utilisateur
 */
export async function getAuthenticatedUserEmail(): Promise<string> {
    const session = await requireSession()

    if (!session.user.email) {
        redirect('/sign-in')
    }

    return session.user.email
}

/**
 * Erreur levée quand l'appelant d'une Server Action n'a pas les droits requis.
 */
export class UnauthorizedError extends Error {
    constructor(message = 'Non autorisé') {
        super(message)
        this.name = 'UnauthorizedError'
    }
}

/**
 * Garde d'autorisation pour les Server Actions : exige une session valide ET l'un des rôles donnés.
 *
 * Une Server Action est un endpoint HTTP appelable directement (le proxy ignore les POST) :
 * la protection des pages/menus ne suffit pas, chaque action sensible doit se protéger elle-même.
 * Le rôle est lu dans la session (cookie cache de 5 min) : aucune requête DB supplémentaire.
 *
 * À appeler en première instruction de l'action, AVANT tout try/catch, pour que
 * l'erreur ne soit pas avalée par un fallback silencieux.
 *
 * @throws UnauthorizedError si non authentifié ou rôle insuffisant
 */
export async function requireRole(...roles: BackofficeUserRoles[]) {
    const session = await getSession()

    if (!session?.user) {
        throw new UnauthorizedError('Non authentifié')
    }

    const role = session.user.role as BackofficeUserRoles | null | undefined
    if (!role || !roles.includes(role)) {
        throw new UnauthorizedError()
    }

    return session
}

/** Raccourci : réservé aux administrateurs. */
export const requireAdmin = () => requireRole(BackofficeUserRoles.admin)
