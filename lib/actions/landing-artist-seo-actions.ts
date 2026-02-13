'use server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export interface LandingArtistSeoData {
    seoTitle?: string | null
    stylesInfluences?: string | null
    artisticApproach?: string | null
    artitudeUrl?: string | null
    interviewUrl?: string | null
    keyWorkIds?: number[] // presaleArtworkId[] dans l'ordre voulu
}

/**
 * Récupère le SEO d'un artiste landing (avec ses keyWorks)
 */
export async function getLandingArtistSeo(landingArtistId: number) {
    return prisma.landingArtistSeo.findUnique({
        where: { landingArtistId },
        include: {
            keyWorks: {
                include: {
                    presaleArtwork: true,
                },
                orderBy: { order: 'asc' },
            },
        },
    })
}

/**
 * Récupère les PresaleArtworks disponibles (non vendues) pour un artiste donné
 */
export async function getPresaleArtworksForArtist(artistId: number) {
    return prisma.presaleArtwork.findMany({
        where: {
            artistId,
            isSold: false,
        },
        orderBy: { name: 'asc' },
        select: {
            id: true,
            name: true,
            imageUrl: true,
            price: true,
            width: true,
            height: true,
        },
    })
}

/**
 * Crée ou met à jour le SEO d'un artiste landing (upsert),
 * et remplace entièrement les KeyWorks (delete + createMany).
 */
export async function upsertLandingArtistSeoAction(
    landingArtistId: number,
    data: LandingArtistSeoData
): Promise<{ success: boolean; message?: string }> {
    try {
        const { keyWorkIds, ...seoFields } = data

        // Upsert LandingArtistSeo
        const seo = await prisma.landingArtistSeo.upsert({
            where: { landingArtistId },
            update: seoFields,
            create: {
                landingArtistId,
                ...seoFields,
            },
        })

        // Remplacer les KeyWorks si fournis
        if (keyWorkIds !== undefined) {
            await prisma.landingArtistKeyWork.deleteMany({
                where: { landingArtistSeoId: seo.id },
            })

            if (keyWorkIds.length > 0) {
                await prisma.landingArtistKeyWork.createMany({
                    data: keyWorkIds.map((presaleArtworkId, index) => ({
                        landingArtistSeoId: seo.id,
                        presaleArtworkId,
                        order: index,
                    })),
                })
            }
        }

        revalidatePath(`/landing/landingArtists/${landingArtistId}/edit`)
        revalidatePath('/landing/landingArtists')

        return { success: true }
    } catch (error: any) {
        console.error('Erreur lors de la mise à jour du SEO artiste:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la mise à jour du SEO',
        }
    }
}
