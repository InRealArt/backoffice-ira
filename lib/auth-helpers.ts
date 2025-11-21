import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'

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

