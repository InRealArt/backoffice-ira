'use server'

import { prisma } from '@/lib/prisma'

export interface CheckAuthorizedUserResult {
    authorized: boolean
    message: string
}

/**
 * Vérifie si un utilisateur est autorisé à accéder au backoffice
 * @param email - Email de l'utilisateur à vérifier
 * @returns Résultat de la vérification
 */
export async function checkAuthorizedUser(email: string): Promise<CheckAuthorizedUserResult> {
    try {
        if (!email) {
            return {
                authorized: false,
                message: 'Email manquant'
            }
        }

        // Vérifier si l'email existe dans la table backofficeUser
        const user = await prisma.backofficeUser.findUnique({
            where: { email }
        })

        return {
            authorized: !!user,
            message: user ? 'Utilisateur autorisé' : 'Utilisateur non autorisé'
        }
    } catch (error) {
        console.error('Erreur lors de la vérification de l\'autorisation:', error)
        return {
            authorized: false,
            message: 'Erreur serveur'
        }
    }
}

/**
 * Vérifie si un utilisateur est admin
 * @param email - Email de l'utilisateur à vérifier
 * @returns True si l'utilisateur est admin
 */
export async function checkIsAdmin(email: string): Promise<boolean> {
    try {
        if (!email) return false

        const user = await prisma.backofficeUser.findUnique({
            where: { email },
            select: { role: true }
        })

        return user?.role === 'admin'
    } catch (error) {
        console.error('Erreur lors de la vérification admin:', error)
        return false
    }
}

/**
 * Récupère les wallets liés d'un utilisateur
 * @param address - Adresse du wallet principal
 * @returns Wallets liés ou null
 */
export async function getLinkedWallets(address: string) {
    try {
        if (!address) {
            throw new Error('Adresse du portefeuille requise')
        }

        const user = await prisma.backofficeUser.findUnique({
            where: { walletAddress: address },
            select: { linkedWallets: true }
        })

        if (!user) {
            throw new Error('Utilisateur non trouvé')
        }

        return user.linkedWallets
    } catch (error) {
        console.error('Erreur lors de la récupération des wallets liés:', error)
        throw error
    }
}

