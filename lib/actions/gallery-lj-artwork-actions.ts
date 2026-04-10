'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { toRelativePath } from '@/lib/r2/url'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { r2Client, R2_BUCKET_NAME } from '@/lib/r2/client'

const REVALIDATE_PATH = '/fr/galleryLj/artworks'

/**
 * Récupère toutes les œuvres de la galerie LJ avec leur artiste
 */
export async function getAllGalleryLjArtworks() {
    try {
        const artworks = await prisma.galleryLjArtwork.findMany({
            include: {
                artist: {
                    select: {
                        id: true,
                        pseudo: true,
                        firstName: true,
                        lastName: true,
                    }
                }
            },
            orderBy: {
                name: 'asc'
            }
        })
        // Prisma returns Decimal for price — convert to number so the data is
        // serializable when passed from Server Components to Client Components.
        return artworks.map(artwork => ({
            ...artwork,
            price: artwork.price != null ? artwork.price.toNumber() : null,
        }))
    } catch (error) {
        console.error('Erreur lors de la récupération des œuvres galerie LJ:', error)
        return []
    }
}

/**
 * Récupère une œuvre galerie LJ par son ID
 */
export async function getGalleryLjArtworkById(id: number) {
    try {
        const artwork = await prisma.galleryLjArtwork.findUnique({
            where: { id },
            include: {
                artist: {
                    select: {
                        id: true,
                        pseudo: true,
                        firstName: true,
                        lastName: true,
                    }
                }
            }
        })
        if (!artwork) return null
        // Prisma returns Decimal for price — convert to number so the value is
        // serializable when returned from a server action to a client component.
        return {
            ...artwork,
            price: artwork.price != null ? artwork.price.toNumber() : null,
        }
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'œuvre galerie LJ:', error)
        return null
    }
}

/**
 * Crée une nouvelle œuvre dans la galerie LJ
 */
export async function createGalleryLjArtwork(data: {
    name: string
    artistId: number
    imageUrl: string
    price?: number | null
    dimensions?: string | null
    creationYear?: number | null
    visible?: boolean
}) {
    try {
        const artwork = await prisma.galleryLjArtwork.create({
            data: {
                name: data.name,
                artistId: data.artistId,
                imageUrl: toRelativePath(data.imageUrl) ?? data.imageUrl,
                price: data.price ?? null,
                dimensions: data.dimensions ?? null,
                creationYear: data.creationYear ?? null,
                visible: data.visible ?? true
            }
        })

        revalidatePath(REVALIDATE_PATH)
        return { success: true, artwork }
    } catch (error) {
        console.error('Erreur lors de la création de l\'œuvre galerie LJ:', error)
        return { success: false, message: (error as Error).message }
    }
}

/**
 * Met à jour une œuvre galerie LJ existante
 */
export async function updateGalleryLjArtwork(
    id: number,
    data: {
        name?: string
        artistId?: number
        imageUrl?: string | null
        price?: number | null
        dimensions?: string | null
        creationYear?: number | null
        visible?: boolean
    }
) {
    try {
        // Normalize imageUrl to relative path if provided
        const normalizedImageUrl = data.imageUrl !== undefined
            ? (data.imageUrl ? (toRelativePath(data.imageUrl) ?? data.imageUrl) : null)
            : undefined

        // Build update payload — use Record to avoid Prisma's strict union narrowing on optional FK
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const prismaData: Record<string, any> = {}
        if (data.name !== undefined) prismaData.name = data.name
        if (data.artistId !== undefined) prismaData.artistId = data.artistId
        if (data.price !== undefined) prismaData.price = data.price
        if (data.dimensions !== undefined) prismaData.dimensions = data.dimensions
        if (data.creationYear !== undefined) prismaData.creationYear = data.creationYear
        if (data.visible !== undefined) prismaData.visible = data.visible
        if (normalizedImageUrl !== undefined) prismaData.imageUrl = normalizedImageUrl

        const artwork = await prisma.galleryLjArtwork.update({
            where: { id },
            data: prismaData
        })

        revalidatePath(REVALIDATE_PATH)
        revalidatePath(`/fr/galleryLj/artworks/${id}/edit`)
        return { success: true, artwork }
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'œuvre galerie LJ:', error)
        return { success: false, message: (error as Error).message }
    }
}

/**
 * Supprime une œuvre galerie LJ ainsi que son image dans Cloudflare R2.
 *
 * La suppression R2 est non-bloquante : si l'objet n'existe pas ou si R2 renvoie
 * une erreur, la suppression en base de données est quand même effectuée.
 */
export async function deleteGalleryLjArtwork(id: number) {
    try {
        const artwork = await prisma.galleryLjArtwork.findUnique({
            where: { id },
            select: { imageUrl: true }
        })

        if (!artwork) {
            return { success: false, message: 'Œuvre introuvable' }
        }

        // Supprimer l'image R2 avant la suppression en base.
        // imageUrl est stocké en chemin relatif (ex: galleryLj/artists/<slug>/artworks/<slug>.webp).
        // On utilise toRelativePath() pour gérer les éventuelles URLs absolues legacy.
        if (artwork.imageUrl) {
            const r2Key = toRelativePath(artwork.imageUrl) ?? artwork.imageUrl

            try {
                await r2Client.send(
                    new DeleteObjectCommand({
                        Bucket: R2_BUCKET_NAME,
                        Key: r2Key,
                    })
                )
                console.log(`[deleteGalleryLjArtwork] Image R2 supprimée: ${r2Key}`)
            } catch (r2Error: unknown) {
                // NoSuchKey = fichier déjà absent, on ignore silencieusement
                const err = r2Error as { name?: string; $metadata?: { httpStatusCode?: number } }
                if (err?.name === 'NoSuchKey' || err?.$metadata?.httpStatusCode === 404) {
                    console.log(`[deleteGalleryLjArtwork] Image R2 introuvable (déjà supprimée): ${r2Key}`)
                } else {
                    // Toute autre erreur R2 est loggée mais ne bloque pas la suppression en base
                    console.error(`[deleteGalleryLjArtwork] Erreur R2 lors de la suppression de ${r2Key}:`, r2Error)
                }
            }
        }

        await prisma.galleryLjArtwork.delete({
            where: { id }
        })

        revalidatePath(REVALIDATE_PATH)
        return { success: true }
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'œuvre galerie LJ:', error)
        return { success: false, message: (error as Error).message }
    }
}
