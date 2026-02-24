'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

/**
 * Récupère une image par URL côté serveur (évite CORS) et la retourne en base64.
 * Utilisé pour ré-uploader l'image de profil artiste IRA vers artistsUGC.
 */
export async function fetchImageForUgcUpload(
    imageUrl: string
): Promise<{ success: true; base64: string; mimeType: string } | { success: false; message: string }> {
    try {
        const res = await fetch(imageUrl, { cache: 'no-store' })
        if (!res.ok) {
            return { success: false, message: `Impossible de récupérer l'image (${res.status})` }
        }
        const buffer = await res.arrayBuffer()
        const base64 = Buffer.from(buffer).toString('base64')
        const mimeType = res.headers.get('content-type')?.split(';')[0]?.trim() || 'image/jpeg'
        return { success: true, base64, mimeType }
    } catch (error) {
        console.error('fetchImageForUgcUpload:', error)
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Erreur lors de la récupération de l\'image',
        }
    }
}

const REVALIDATE_PATHS = [
    '/landing/ugc/artist-profiles',
    '/landing/ugc/top-artists',
]

export type UgcArtistProfileWithRelations = NonNullable<Awaited<ReturnType<typeof getUgcArtistProfileById>>>

export async function getAllUgcArtistProfiles() {
    return prisma.landingUgcArtistProfile.findMany({
        include: {
            landingArtist: {
                include: {
                    artist: {
                        select: { name: true, surname: true, pseudo: true },
                    },
                },
            },
        },
        orderBy: [{ surname: 'asc' }, { name: 'asc' }],
    })
}

export async function getUgcArtistProfileById(id: number) {
    return prisma.landingUgcArtistProfile.findUnique({
        where: { id },
        include: {
            landingArtist: {
                include: {
                    artist: {
                        select: { name: true, surname: true, pseudo: true },
                    },
                },
            },
        },
    })
}

export async function getLandingArtistsForUgcSelection() {
    return prisma.landingArtist.findMany({
        where: { artistsPage: true },
        orderBy: { artist: { name: 'asc' } },
        include: {
            artist: { select: { name: true, surname: true, pseudo: true } },
            ugcArtistProfile: { select: { id: true } },
        },
    })
}

export async function createUgcArtistProfile(data: {
    landingArtistId?: number | null
    name?: string | null
    surname?: string | null
    pseudo?: string | null
    profileImageUrl: string
    title?: string | null
    description?: string | null
    mediaUrls?: string[]
}): Promise<{ success: boolean; id?: number; message?: string }> {
    try {
        const payload = {
            ...data,
            mediaUrls: data.mediaUrls ?? [],
        }
        const profile = await prisma.landingUgcArtistProfile.create({ data: payload })
        REVALIDATE_PATHS.forEach((p) => revalidatePath(p))
        return { success: true, id: profile.id }
    } catch (error) {
        console.error('Error creating UGC artist profile:', error)
        return { success: false, message: 'Erreur lors de la création' }
    }
}

export async function updateUgcArtistProfile(
    id: number,
    data: {
        name?: string | null
        surname?: string | null
        pseudo?: string | null
        profileImageUrl?: string
        title?: string | null
        description?: string | null
        mediaUrls?: string[]
    }
): Promise<{ success: boolean; message?: string }> {
    try {
        await prisma.landingUgcArtistProfile.update({ where: { id }, data })
        REVALIDATE_PATHS.forEach((p) => revalidatePath(p))
        return { success: true }
    } catch (error) {
        console.error('Error updating UGC artist profile:', error)
        return { success: false, message: 'Erreur lors de la mise à jour' }
    }
}

export async function deleteUgcArtistProfile(
    id: number
): Promise<{ success: boolean; message?: string }> {
    try {
        await prisma.landingUgcArtistProfile.delete({ where: { id } })
        REVALIDATE_PATHS.forEach((p) => revalidatePath(p))
        return { success: true }
    } catch (error) {
        console.error('Error deleting UGC artist profile:', error)
        return { success: false, message: 'Erreur lors de la suppression' }
    }
}
