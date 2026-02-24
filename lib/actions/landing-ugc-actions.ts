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
            landingUgcArtistProfile: true,
        },
    })
}

/**
 * Récupère tous les profils UGC artiste avec leur statut top artiste
 */
export async function getAllUgcArtistProfilesWithTopStatus() {
    const [profiles, topArtists] = await Promise.all([
        prisma.landingUgcArtistProfile.findMany({
            orderBy: [{ surname: 'asc' }, { name: 'asc' }],
        }),
        prisma.landingUgcTopArtists.findMany({
            select: { landingUgcArtistProfileId: true },
        }),
    ])
    const topProfileIds = new Set(
        topArtists.map((t) => t.landingUgcArtistProfileId)
    )
    return { profiles, topProfileIds }
}

/**
 * Ajoute un profil UGC artiste dans les top artistes UGC
 * Le profil est ajouté en fin de liste (order = max + 1)
 */
export async function addTopArtist(
    ugcArtistProfileId: number
): Promise<{ success: boolean; message?: string }> {
    try {
        // Vérifier que ce profil n'est pas déjà dans les top artistes
        const existing = await prisma.landingUgcTopArtists.findFirst({
            where: { landingUgcArtistProfileId: ugcArtistProfileId },
        })
        if (existing) {
            return { success: false, message: 'Ce profil est déjà dans les top artistes' }
        }

        const maxOrderResult = await prisma.landingUgcTopArtists.aggregate({
            _max: { order: true },
        })
        const nextOrder = (maxOrderResult._max.order ?? 0) + 1

        await prisma.landingUgcTopArtists.create({
            data: { landingUgcArtistProfileId: ugcArtistProfileId, order: nextOrder },
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
 * Retire un profil UGC artiste des top artistes UGC
 */
export async function removeTopArtist(
    ugcArtistProfileId: number
): Promise<{ success: boolean; message?: string }> {
    try {
        await prisma.landingUgcTopArtists.deleteMany({
            where: { landingUgcArtistProfileId: ugcArtistProfileId },
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
