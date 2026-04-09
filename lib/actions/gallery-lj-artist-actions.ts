'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { toRelativePath } from '@/lib/r2/url'

const REVALIDATE_PATH = '/fr/galleryLj/artists'

/**
 * Récupère tous les artistes de la galerie LJ
 */
export async function getAllGalleryLjArtists() {
    try {
        const artists = await prisma.galleryLjArtist.findMany({
            include: {
                artworks: true
            },
            orderBy: {
                pseudo: 'asc'
            }
        })
        return artists
    } catch (error) {
        console.error('Erreur lors de la récupération des artistes galerie LJ:', error)
        return []
    }
}

/**
 * Récupère un artiste galerie LJ par son ID
 */
export async function getGalleryLjArtistById(id: number) {
    try {
        const artist = await prisma.galleryLjArtist.findUnique({
            where: { id },
            include: {
                artworks: true
            }
        })
        return artist
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'artiste galerie LJ:', error)
        return null
    }
}

/**
 * Crée un nouvel artiste dans la galerie LJ
 */
export async function createGalleryLjArtist(data: {
    pseudo: string
    firstName?: string | null
    lastName?: string | null
    imageUrl?: string | null
    visible?: boolean
}) {
    try {
        const artist = await prisma.galleryLjArtist.create({
            data: {
                pseudo: data.pseudo,
                firstName: data.firstName ?? null,
                lastName: data.lastName ?? null,
                imageUrl: data.imageUrl ? (toRelativePath(data.imageUrl) ?? data.imageUrl) : null,
                visible: data.visible ?? true
            }
        })

        revalidatePath(REVALIDATE_PATH)
        return { success: true, artist }
    } catch (error) {
        console.error('Erreur lors de la création de l\'artiste galerie LJ:', error)
        return { success: false, message: (error as Error).message }
    }
}

/**
 * Met à jour un artiste galerie LJ existant
 */
export async function updateGalleryLjArtist(
    id: number,
    data: {
        pseudo?: string
        firstName?: string | null
        lastName?: string | null
        imageUrl?: string | null
        visible?: boolean
    }
) {
    try {
        const updateData: typeof data & { imageUrl?: string | null } = { ...data }

        if (updateData.imageUrl !== undefined) {
            updateData.imageUrl = updateData.imageUrl
                ? (toRelativePath(updateData.imageUrl) ?? updateData.imageUrl)
                : null
        }

        const artist = await prisma.galleryLjArtist.update({
            where: { id },
            data: updateData
        })

        revalidatePath(REVALIDATE_PATH)
        revalidatePath(`/fr/galleryLj/artists/${id}/edit`)
        return { success: true, artist }
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'artiste galerie LJ:', error)
        return { success: false, message: (error as Error).message }
    }
}

/**
 * Supprime un artiste galerie LJ (et ses œuvres via la cascade Prisma)
 */
export async function deleteGalleryLjArtist(id: number) {
    try {
        // Récupérer l'imageUrl avant suppression pour pouvoir supprimer le fichier R2 côté client
        const artist = await prisma.galleryLjArtist.findUnique({
            where: { id },
            select: { imageUrl: true }
        })

        if (!artist) {
            return { success: false, message: 'Artiste introuvable' }
        }

        // Supprimer l'artiste — les artworks sont supprimés en cascade par la DB si configuré,
        // sinon il faut d'abord supprimer les artworks manuellement
        await prisma.galleryLjArtist.delete({
            where: { id }
        })

        revalidatePath(REVALIDATE_PATH)
        return { success: true, imageUrl: artist.imageUrl }
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'artiste galerie LJ:', error)
        return { success: false, message: (error as Error).message }
    }
}
