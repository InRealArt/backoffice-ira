import { BackofficeUserRoles } from '@prisma/client'
import { prisma } from '../prisma'

/**
 * Recherche un utilisateur par son adresse email
 * 
 * @param email - L'adresse email de l'utilisateur à rechercher
 * @returns L'utilisateur trouvé ou null si aucun utilisateur ne correspond
 */
export async function getUserByEmail(email: string) {
    if (!email) {
        return null
    }

    try {
        const user = await prisma.backofficeUser.findUnique({
            where: {
                email: email.toLowerCase().trim() // Normalisation de l'email
            }
        })

        return user
    } catch (error) {
        console.error('Erreur lors de la recherche de l\'utilisateur par email:', error)
        return null
    }
}

/**
 * Vérifie si un utilisateur est administrateur
 * 
 * @param email - L'adresse email de l'utilisateur à vérifier
 * @returns true si l'utilisateur est administrateur, false sinon
 */
export async function isUserAdmin(email: string) {
    if (!email) {
        return false
    }

    try {
        const user = await prisma.backofficeUser.findUnique({
            where: {
                email: email.toLowerCase().trim()
            },
            select: {
                role: true
            }
        })

        return user?.role === BackofficeUserRoles.admin
    } catch (error) {
        console.error('Erreur lors de la vérification des droits administrateur:', error)
        return false
    }
}
