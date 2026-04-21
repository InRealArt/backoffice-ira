'use server'

import { prisma } from '@/lib/prisma'
import { Exhibition } from '@/src/generated/prisma/client'
import { revalidatePath } from 'next/cache'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Minimal shape of a LandingArtist for the exhibition artist picker.
 * Uses landingArtistId as `id` since ExhibitionArtist references landingArtistId.
 */
export interface ExhibitionArtistOption {
    id: number          // LandingArtist.id
    name: string | null
    surname: string | null
    pseudo: string | null
}

export async function getAllExhibitions(): Promise<Exhibition[]> {
    try {
        return await prisma.exhibition.findMany({
            orderBy: {
                startDate: 'desc'
            }
        })
    } catch (error) {
        console.error('Erreur lors de la récupération des expositions:', error)
        return []
    }
}

export async function getExhibitionById(id: number): Promise<Exhibition | null> {
    try {
        return await prisma.exhibition.findUnique({
            where: { id }
        })
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'exposition:', error)
        return null
    }
}

export async function createExhibition(data: {
    name: string
    startDate: Date
    endDate: Date
    address: string
    imageUrl?: string | null
    description?: string | null
    linkToEvent?: string | null
    artistIds?: number[]
}): Promise<{ success: boolean; message?: string; id?: number }> {
    try {
        const exhibition = await prisma.exhibition.create({
            data: {
                name: data.name,
                startDate: data.startDate,
                endDate: data.endDate,
                address: data.address,
                imageUrl: data.imageUrl ?? null,
                description: data.description ?? null,
                linkToEvent: data.linkToEvent ?? null,
            }
        })

        if (data.artistIds && data.artistIds.length > 0) {
            await prisma.exhibitionArtist.createMany({
                data: data.artistIds.map((landingArtistId) => ({
                    exhibitionId: exhibition.id,
                    landingArtistId,
                })),
                skipDuplicates: true,
            })
        }

        revalidatePath('/landing/exhibitions')

        return { success: true, id: exhibition.id }
    } catch (error: any) {
        console.error('Erreur lors de la création de l\'exposition:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la création.'
        }
    }
}

export async function updateExhibition(
    id: number,
    data: {
        name?: string
        startDate?: Date
        endDate?: Date
        address?: string
        imageUrl?: string | null
        description?: string | null
        linkToEvent?: string | null
        artistIds?: number[]
    }
): Promise<{ success: boolean; message?: string }> {
    try {
        const { artistIds, ...exhibitionData } = data

        await prisma.exhibition.update({
            where: { id },
            data: exhibitionData
        })

        if (artistIds !== undefined) {
            await prisma.$transaction([
                prisma.exhibitionArtist.deleteMany({ where: { exhibitionId: id } }),
                ...(artistIds.length > 0
                    ? [prisma.exhibitionArtist.createMany({
                        data: artistIds.map((landingArtistId) => ({
                            exhibitionId: id,
                            landingArtistId,
                        })),
                        skipDuplicates: true,
                    })]
                    : [])
            ])
        }

        revalidatePath('/landing/exhibitions')
        revalidatePath(`/landing/exhibitions/${id}/edit`)

        return { success: true }
    } catch (error: any) {
        console.error('Erreur lors de la mise à jour de l\'exposition:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la mise à jour.'
        }
    }
}

// ---------------------------------------------------------------------------
// Landing artists for the exhibition artist picker
// ---------------------------------------------------------------------------

/**
 * Returns all LandingArtists with the minimal fields needed for the picker.
 * Called server-side from page components; passed as props to the form.
 */
export async function getAllLandingArtistsForExhibition(): Promise<ExhibitionArtistOption[]> {
    try {
        const rows = await prisma.landingArtist.findMany({
            select: {
                id: true,
                artist: {
                    select: {
                        name: true,
                        surname: true,
                        pseudo: true,
                    }
                }
            },
            orderBy: {
                artist: { name: 'asc' }
            }
        })
        return rows.map((row) => ({
            id: row.id,
            name: row.artist.name,
            surname: row.artist.surname,
            pseudo: row.artist.pseudo,
        }))
    } catch (error) {
        console.error('Erreur lors de la récupération des artistes landing:', error)
        return []
    }
}

/**
 * Returns the landingArtistIds currently associated with an exhibition.
 */
export async function getExhibitionArtistIds(exhibitionId: number): Promise<number[]> {
    try {
        const rows = await prisma.exhibitionArtist.findMany({
            where: { exhibitionId },
            select: { landingArtistId: true }
        })
        return rows.map((r) => r.landingArtistId)
    } catch (error) {
        console.error('Erreur lors de la récupération des artistes de l\'exposition:', error)
        return []
    }
}

/**
 * Replaces the full set of artists for a given exhibition (delete-then-insert).
 * Safe to call on create (exhibitionId known after creation) and on update.
 */
export async function setExhibitionArtists(
    exhibitionId: number,
    landingArtistIds: number[]
): Promise<{ success: boolean; message?: string }> {
    try {
        await prisma.$transaction([
            prisma.exhibitionArtist.deleteMany({ where: { exhibitionId } }),
            ...(landingArtistIds.length > 0
                ? [prisma.exhibitionArtist.createMany({
                    data: landingArtistIds.map((landingArtistId) => ({
                        exhibitionId,
                        landingArtistId,
                    })),
                    skipDuplicates: true,
                })]
                : [])
        ])
        revalidatePath('/landing/exhibitions')
        revalidatePath(`/landing/exhibitions/${exhibitionId}/edit`)
        return { success: true }
    } catch (error: any) {
        console.error('Erreur lors de la mise à jour des artistes de l\'exposition:', error)
        return { success: false, message: 'Erreur lors de la mise à jour des artistes.' }
    }
}

// ---------------------------------------------------------------------------

export async function deleteExhibition(
    id: number
): Promise<{ success: boolean; message?: string }> {
    try {
        await prisma.exhibition.delete({
            where: { id }
        })

        revalidatePath('/landing/exhibitions')

        return { success: true }
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'exposition:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la suppression.'
        }
    }
}
