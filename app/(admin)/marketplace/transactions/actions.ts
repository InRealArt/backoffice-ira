'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function refreshTransactionsData() {
    try {
        // Revalidate the cache for the transactions page
        revalidatePath('/marketplace/transactions')

        // Récupérer l'heure de rafraîchissement
        const refreshTime = new Date().toLocaleTimeString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })

        return {
            success: true,
            timestamp: refreshTime
        }
    } catch (error) {
        console.error('Erreur lors de la revalidation des données:', error)
        return { success: false, error: 'Erreur lors du rafraîchissement des données' }
    }
} 