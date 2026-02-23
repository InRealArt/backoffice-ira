'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

const REVALIDATE_PATHS = ['/landing/ugc/top-artists']

/**
 * Récupère tous les top artistes UGC, ordonnés par leur champ `order`
 */
export async function getTopArtists() {
    return prisma.landingUgcTopArtists.findMany({
        orderBy: { order: 'asc' },
        include: {
            landingArtist: {
                include: {
                    artist: {
                        select: {
                            name: true,
                            surname: true,
                            pseudo: true,
                        },
                    },
                },
            },
        },
    })
}

/**
 * Récupère tous les LandingArtists avec leur statut top artiste UGC
 */
export async function getAllLandingArtistsWithTopStatus() {
    return prisma.landingArtist.findMany({
        where: {
            artistsPage: true,
        },
        orderBy: {
            artist: { name: 'asc' },
        },
        include: {
            artist: {
                select: {
                    name: true,
                    surname: true,
                    pseudo: true,
                },
            },
            ugcTopArtist: true,
        },
    })
}

/**
 * Ajoute un artiste dans les top artistes UGC
 * L'artiste est ajouté en fin de liste (order = max + 1)
 */
export async function addTopArtist(
    landingArtistId: number
): Promise<{ success: boolean; message?: string }> {
    try {
        const maxOrderResult = await prisma.landingUgcTopArtists.aggregate({
            _max: { order: true },
        })
        const nextOrder = (maxOrderResult._max.order ?? 0) + 1

        await prisma.landingUgcTopArtists.upsert({
            where: { landingArtistId },
            create: { landingArtistId, order: nextOrder },
            update: {},
        })

        REVALIDATE_PATHS.forEach((path) => revalidatePath(path))
        return { success: true }
    } catch (error) {
        console.error('Erreur lors de l\'ajout du top artiste:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de l\'ajout',
        }
    }
}

/**
 * Retire un artiste des top artistes UGC
 */
export async function removeTopArtist(
    landingArtistId: number
): Promise<{ success: boolean; message?: string }> {
    try {
        await prisma.landingUgcTopArtists.delete({
            where: { landingArtistId },
        })

        REVALIDATE_PATHS.forEach((path) => revalidatePath(path))
        return { success: true }
    } catch (error) {
        console.error('Erreur lors de la suppression du top artiste:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la suppression',
        }
    }
}

const MAX_INT4 = 2_147_483_647

/**
 * Met à jour l'ordre des top artistes UGC
 * Ignore les entrées dont l'id n'est pas un INT4 valide (ex. id temporaires côté client).
 */
export async function updateTopArtistsOrder(
    updates: Array<{ id: number; order: number }>
): Promise<{ success: boolean; message?: string }> {
    try {
        const validUpdates = updates.filter(
            (u) => Number.isInteger(u.id) && u.id >= 1 && u.id <= MAX_INT4
        )
        if (validUpdates.length === 0) return { success: true }

        await prisma.$transaction(
            validUpdates.map((update) =>
                prisma.landingUgcTopArtists.update({
                    where: { id: update.id },
                    data: { order: update.order },
                })
            )
        )

        REVALIDATE_PATHS.forEach((path) => revalidatePath(path))
        return { success: true }
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'ordre:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la mise à jour de l\'ordre',
        }
    }
}
