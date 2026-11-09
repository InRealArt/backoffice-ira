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

/** Raccourci : tout utilisateur du backoffice (admin, artiste ou responsable de galerie). */
export const requireBackofficeUser = () =>
    requireRole(
        BackofficeUserRoles.admin,
        BackofficeUserRoles.artist,
        BackofficeUserRoles.galleryManager
    )

/**
 * Contrôle de propriété : l'appelant doit être admin, ou l'artiste `artistId`.
 *
 * Un simple contrôle de rôle ne suffit pas pour les actions artistes : sans lui, un artiste
 * pourrait modifier les données d'un autre en changeant l'identifiant envoyé à l'action (IDOR).
 * L'`artistId` de la session est posé côté serveur depuis la liste blanche (lib/auth.ts).
 *
 * @throws UnauthorizedError si non authentifié, rôle insuffisant ou artiste différent
 */
export async function requireArtistAccess(artistId: number | null | undefined) {
    const session = await requireBackofficeUser()

    if (session.user.role === BackofficeUserRoles.admin) {
        return session
    }

    const sessionArtistId = (session.user as { artistId?: number | null }).artistId
    if (
        session.user.role !== BackofficeUserRoles.artist ||
        artistId == null ||
        sessionArtistId == null ||
        sessionArtistId !== artistId
    ) {
        throw new UnauthorizedError()
    }

    return session
}

/**
 * Contrôle de propriété : l'appelant doit être admin, ou l'utilisateur `userId`
 * (identifiant BackofficeAuthUser).
 *
 * @throws UnauthorizedError si non authentifié ou utilisateur différent
 */
export async function requireAuthUserAccess(userId: string | null | undefined) {
    const session = await requireBackofficeUser()

    if (session.user.role === BackofficeUserRoles.admin) {
        return session
    }

    if (!userId || session.user.id !== userId) {
        throw new UnauthorizedError()
    }

    return session
}
