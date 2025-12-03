'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

/**
 * Interface générique pour les entités avec displayOrder
 */
interface DisplayOrderEntity {
    id: number
    displayOrder: number | null
}

/**
 * Met à jour l'ordre d'affichage d'une liste d'entités
 * Cette fonction est générique et peut être utilisée pour n'importe quel modèle
 * 
 * @param entityType - Le type d'entité (ex: 'presaleArtwork', 'item', etc.)
 * @param updates - Tableau d'objets { id, displayOrder } pour chaque entité
 * @param revalidatePaths - Chemins à revalider après la mise à jour
 */
export async function updateDisplayOrder<T extends DisplayOrderEntity>(
    entityType: 'presaleArtwork',
    updates: Array<{ id: number; displayOrder: number | null }>,
    revalidatePaths: string[] = []
): Promise<{ success: boolean; message?: string }> {
    try {
        // Utiliser une transaction pour garantir l'atomicité
        await prisma.$transaction(
            updates.map((update) => {
                if (entityType === 'presaleArtwork') {
                    return prisma.presaleArtwork.update({
                        where: { id: update.id },
                        data: { displayOrder: update.displayOrder }
                    })
                }
                // Ajouter d'autres types d'entités ici si nécessaire
                throw new Error(`Type d'entité non supporté: ${entityType}`)
            })
        )

        // Revalider les chemins spécifiés
        revalidatePaths.forEach((path) => {
            revalidatePath(path)
        })

        return { success: true }
    } catch (error) {
        console.error(`Erreur lors de la mise à jour de l'ordre d'affichage:`, error)
        return {
            success: false,
            message: (error as Error).message
        }
    }
}

/**
 * Récupère le displayOrder maximum pour un artiste donné
 */
export async function getMaxDisplayOrderByArtist(
    artistId: number
): Promise<number> {
    try {
        const result = await prisma.presaleArtwork.aggregate({
            where: { artistId },
            _max: {
                displayOrder: true
            }
        })

        return result._max.displayOrder ?? 0
    } catch (error) {
        console.error('Erreur lors de la récupération du displayOrder maximum:', error)
        return 0
    }
}

/**
 * Réinitialise l'ordre d'affichage pour toutes les œuvres d'un artiste
 * Les œuvres seront ordonnées selon leur ordre actuel (order) ou par ID
 */
export async function resetDisplayOrderForArtist(
    artistId: number,
    revalidatePaths: string[] = []
): Promise<{ success: boolean; message?: string }> {
    try {
        // Récupérer toutes les œuvres de l'artiste, triées par order puis par id
        const artworks = await prisma.presaleArtwork.findMany({
            where: { artistId },
            orderBy: [
                { order: 'asc' },
                { id: 'asc' }
            ]
        })

        // Mettre à jour le displayOrder pour chaque œuvre
        await prisma.$transaction(
            artworks.map((artwork, index) =>
                prisma.presaleArtwork.update({
                    where: { id: artwork.id },
                    data: { displayOrder: index + 1 }
                })
            )
        )

        // Revalider les chemins
        revalidatePaths.forEach((path) => {
            revalidatePath(path)
        })

        return { success: true }
    } catch (error) {
        console.error('Erreur lors de la réinitialisation de l\'ordre d\'affichage:', error)
        return {
            success: false,
            message: (error as Error).message
        }
    }
}

