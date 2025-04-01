'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { PresaleArtwork } from '@prisma/client'

/**
 * Récupère toutes les œuvres en prévente
 */
export async function getAllPresaleArtworks() {
    try {
        const presaleArtworks = await prisma.presaleArtwork.findMany({
            include: {
                artist: true
            },
            orderBy: {
                name: 'asc'
            }
        })

        return presaleArtworks
    } catch (error) {
        console.error('Erreur lors de la récupération des œuvres en prévente:', error)
        return []
    }
}

/**
 * Récupère une œuvre en prévente par son ID
 */
export async function getPresaleArtworkById(id: number) {
    try {
        const presaleArtwork = await prisma.presaleArtwork.findUnique({
            where: { id },
            include: {
                artist: true
            }
        })

        return presaleArtwork
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'œuvre en prévente:', error)
        return null
    }
}

/**
 * Récupère l'ordre maximum des œuvres en prévente
 */
export async function getMaxPresaleArtworkOrder() {
    try {
        const result = await prisma.presaleArtwork.aggregate({
            _max: {
                order: true
            }
        })

        // Retourne le max ou 0 si aucun résultat
        return result._max.order || 0
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'ordre maximum:', error)
        return 0
    }
}

/**
 * Récupère une œuvre en prévente par son ordre
 */
export async function getPresaleArtworkByOrder(order: number) {
    try {
        return await prisma.presaleArtwork.findFirst({
            where: { order }
        })
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'œuvre par ordre:', error)
        return null
    }
}

/**
 * Échange l'ordre entre deux œuvres en prévente
 */
export async function swapPresaleArtworkOrder(id1: number, order1: number, id2: number, order2: number) {
    try {
        // Utiliser une transaction pour garantir l'atomicité
        await prisma.$transaction([
            prisma.presaleArtwork.update({
                where: { id: id1 },
                data: { order: order2 }
            }),
            prisma.presaleArtwork.update({
                where: { id: id2 },
                data: { order: order1 }
            })
        ])

        revalidatePath('/landing/presaleArtworks')
        return true
    } catch (error) {
        console.error('Erreur lors de l\'échange des ordres:', error)
        return false
    }
}

/**
 * Crée une nouvelle œuvre en prévente
 */
export async function createPresaleArtwork(data: {
    name: string
    artistId: number
    price: number
    imageUrl: string
    order?: number
    mockupUrls?: string
}) {
    try {
        // Si aucun ordre n'est fourni, utiliser l'ordre maximum + 1
        let orderToUse = data.order

        if (!orderToUse) {
            const maxOrder = await getMaxPresaleArtworkOrder()
            orderToUse = maxOrder + 1
        }

        const presaleArtwork = await prisma.presaleArtwork.create({
            data: {
                name: data.name,
                artistId: data.artistId,
                price: data.price,
                imageUrl: data.imageUrl,
                order: orderToUse,
                mockupUrls: data.mockupUrls || "[]"
            },
            include: {
                artist: true
            }
        })

        revalidatePath('/landing/presaleArtworks')
        return {
            success: true,
            presaleArtwork
        }
    } catch (error) {
        console.error('Erreur lors de la création de l\'œuvre en prévente:', error)
        return {
            success: false,
            message: (error as Error).message
        }
    }
}

/**
 * Met à jour une œuvre en prévente existante
 */
export async function updatePresaleArtwork(id: number, data: {
    name?: string
    artistId?: number
    price?: number
    imageUrl?: string
    order?: number
    mockupUrls?: string
}) {
    try {
        // Gérer l'échange d'ordre si nécessaire
        if (data.order !== undefined) {
            const currentArtwork = await getPresaleArtworkById(id)

            if (currentArtwork && currentArtwork.order !== data.order) {
                // Vérifier s'il existe une œuvre avec l'ordre cible
                const targetArtwork = await getPresaleArtworkByOrder(data.order)

                if (targetArtwork) {
                    // Échanger les ordres
                    await swapPresaleArtworkOrder(
                        id,
                        currentArtwork.order || 0,
                        targetArtwork.id,
                        targetArtwork.order || 0
                    )

                    // Supprimer l'ordre des données à mettre à jour car il a déjà été modifié
                    delete data.order
                }
            }
        }

        // Mettre à jour les autres données
        const presaleArtwork = await prisma.presaleArtwork.update({
            where: { id },
            data,
            include: {
                artist: true
            }
        })

        revalidatePath('/landing/presaleArtworks')
        revalidatePath(`/landing/presaleArtworks/${id}/edit`)

        return {
            success: true,
            presaleArtwork
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'œuvre en prévente:', error)
        return {
            success: false,
            message: (error as Error).message
        }
    }
}

/**
 * Supprime une œuvre en prévente
 */
export async function deletePresaleArtwork(id: number) {
    try {
        // Récupérer l'œuvre pour connaître son ordre
        const artwork = await prisma.presaleArtwork.findUnique({
            where: { id }
        })

        if (!artwork) {
            return {
                success: false,
                message: 'Œuvre en prévente introuvable'
            }
        }

        // Stocker l'ordre pour utilisation ultérieure
        const deletedOrder = artwork.order

        // Supprimer l'œuvre
        await prisma.presaleArtwork.delete({
            where: { id }
        })

        // Si l'œuvre avait un ordre défini, mettre à jour les ordres des autres œuvres
        if (deletedOrder !== null) {
            // Décrémenter l'ordre de toutes les œuvres dont l'ordre est supérieur à celui de l'œuvre supprimée
            await prisma.presaleArtwork.updateMany({
                where: {
                    order: {
                        gt: deletedOrder
                    }
                },
                data: {
                    // Décrémenter l'ordre de 1
                    order: {
                        decrement: 1
                    }
                }
            })
        }

        revalidatePath('/landing/presaleArtworks')

        return {
            success: true,
            message: 'Œuvre en prévente supprimée avec succès'
        }
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'œuvre en prévente:', error)
        return {
            success: false,
            message: (error as Error).message
        }
    }
} 