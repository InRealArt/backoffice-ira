'use server'

import { auth } from '@/lib/auth'
import { getSession, requireSession } from '@/lib/auth-helpers'
import { headers } from 'next/headers'

export interface CheckAuthorizedUserResult {
    authorized: boolean
    message: string
}

/**
 * Vérifie que l'appelant est un utilisateur authentifié du backoffice.
 * Basé sur la session serveur (aucun email accepté du client : une Server Action est
 * appelable directement, un paramètre email servirait d'oracle d'existence de compte).
 * Le cache client est géré par le hook useAuthorization.
 */
export async function checkAuthorizedUser(): Promise<CheckAuthorizedUserResult> {
    const session = await getSession()
    const authorized = !!session?.user
    return {
        authorized,
        message: authorized ? 'Utilisateur autorisé' : 'Utilisateur non autorisé'
    }
}

/**
 * Vérifie si l'utilisateur DE LA SESSION COURANTE est admin.
 * Aucun email n'est accepté en paramètre : une Server Action est appelable directement
 * par n'importe quel client, un paramètre email servirait d'oracle (existence/rôle d'un compte).
 * @returns True si l'utilisateur connecté est admin
 */
export async function checkIsAdmin(): Promise<boolean> {
    const session = await getSession()
    return session?.user?.role === 'admin'
}

/**
 * Change le mot de passe d'un utilisateur authentifié
 * Ne nécessite pas l'ancien mot de passe, seulement une session valide
 * @param newPassword - Le nouveau mot de passe
 * @returns Résultat de l'opération
 */
export async function setUserPassword(
    newPassword: string
): Promise<{ success: boolean; message: string }> {
    await requireSession()

    try {
        if (!newPassword || newPassword.length < 8) {
            return {
                success: false,
                message: 'Le mot de passe doit contenir au moins 8 caractères'
            }
        }

        // Récupérer les headers de la session
        const headersList = await headers()

        // Utiliser auth.api.setPassword pour changer le mot de passe
        await auth.api.setPassword({
            headers: headersList,
            body: {
                newPassword: newPassword
            }
        })

        return {
            success: true,
            message: 'Mot de passe modifié avec succès'
        }
    } catch (error: any) {
        console.error('Erreur lors du changement de mot de passe:', error)
        return {
            success: false,
            message: error.message || 'Erreur lors du changement de mot de passe'
        }
    }
}

