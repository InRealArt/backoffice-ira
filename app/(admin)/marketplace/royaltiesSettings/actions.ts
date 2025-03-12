'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function updateRoyaltyPercentage(nftResourceId: number, percentage: number) {
    try {
        if (percentage < 0 || percentage > 100) {
            return {
                success: false,
                error: 'Le pourcentage de royalties doit être compris entre 0 et 100'
            }
        }

        // Cette action est fictive pour le moment, car le modèle n'a pas le champ royaltyPercentage
        // À implémenter une fois que le champ sera ajouté au modèle Prisma

        revalidatePath('/marketplace/royaltiesSettings')

        return {
            success: true
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour des royalties:', error)
        return {
            success: false,
            error: 'Une erreur est survenue lors de la mise à jour des royalties'
        }
    }
} 