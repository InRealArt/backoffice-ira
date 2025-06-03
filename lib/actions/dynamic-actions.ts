'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

type WalletInfo = {
    address: string
    chain: string
    connector?: string
}

export async function updateLinkedWallets(
    primaryWalletAddress: string,
    linkedWallet: WalletInfo
) {
    try {
        // Vérifier si le wallet principal existe
        const user = await prisma.backofficeUser.findUnique({
            where: { walletAddress: primaryWalletAddress }
        })

        if (!user) {
            return {
                success: false,
                message: 'Utilisateur non trouvé avec cette adresse de portefeuille'
            }
        }

        // Récupérer les wallets déjà liés
        const currentWallets = user.linkedWallets as WalletInfo[] || []

        // Vérifier si le wallet est déjà présent pour éviter les doublons
        const walletExists = currentWallets.some(
            wallet => wallet.address === linkedWallet.address
        )

        if (!walletExists) {
            // Ajouter le nouveau wallet à la liste
            currentWallets.push(linkedWallet)

            // Mettre à jour l'utilisateur
            await prisma.backofficeUser.update({
                where: { walletAddress: primaryWalletAddress },
                data: { linkedWallets: currentWallets }
            })

            // Actualiser les pages qui affichent ces données
            revalidatePath('/dashboard')
            revalidatePath('/profile')
        }

        return { success: true }
    } catch (error) {
        console.error('Erreur lors de la mise à jour des wallets liés:', error)
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Erreur inconnue'
        }
    }
} 