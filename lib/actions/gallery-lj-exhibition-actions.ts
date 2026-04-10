'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { toRelativePath } from '@/lib/r2/url'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { r2Client, R2_BUCKET_NAME } from '@/lib/r2/client'

const REVALIDATE_PATH = '/fr/galleryLj/exhibitions'

/**
 * Récupère toutes les expositions de la galerie LJ avec le nombre d'œuvres liées
 */
export async function getAllGalleryLjExhibitions() {
    try {
        const exhibitions = await prisma.galleryLjExhibition.findMany({
            include: {
                _count: {
                    select: { artworks: true }
                }
            },
            orderBy: {
                name: 'asc'
            }
        })
        return exhibitions
    } catch (error) {
        console.error('Erreur lors de la récupération des expositions galerie LJ:', error)
        return []
    }
}

/**
 * Récupère une exposition galerie LJ par son ID, avec ses œuvres liées
 */
export async function getGalleryLjExhibitionById(id: number) {
    try {
        const exhibition = await prisma.galleryLjExhibition.findUnique({
            where: { id },
            include: {
                artworks: true
            }
        })
        return exhibition ?? null
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'exposition galerie LJ:', error)
        return null
    }
}

/**
 * Crée une nouvelle exposition dans la galerie LJ
 */
export async function createGalleryLjExhibition(data: {
    name: string
    description?: string | null
    startDate?: Date | null
    endDate?: Date | null
    location?: string | null
    imageUrl?: string | null
    visible?: boolean
}) {
    try {
        const exhibition = await prisma.galleryLjExhibition.create({
            data: {
                name: data.name,
                description: data.description ?? null,
                startDate: data.startDate ?? null,
                endDate: data.endDate ?? null,
                location: data.location ?? null,
                imageUrl: data.imageUrl ? (toRelativePath(data.imageUrl) ?? data.imageUrl) : null,
                visible: data.visible ?? true
            }
        })

        revalidatePath(REVALIDATE_PATH)
        return { success: true, exhibition }
    } catch (error) {
        console.error('Erreur lors de la création de l\'exposition galerie LJ:', error)
        return { success: false, message: (error as Error).message }
    }
}

/**
 * Met à jour une exposition galerie LJ existante
 */
export async function updateGalleryLjExhibition(
    id: number,
    data: {
        name?: string
        description?: string | null
        startDate?: Date | null
        endDate?: Date | null
        location?: string | null
        imageUrl?: string | null
        visible?: boolean
    }
) {
    try {
        // Normalize imageUrl to relative path if provided
        const normalizedImageUrl = data.imageUrl !== undefined
            ? (data.imageUrl ? (toRelativePath(data.imageUrl) ?? data.imageUrl) : null)
            : undefined

        // Build update payload — use Record to avoid Prisma's strict union narrowing on optional fields
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const prismaData: Record<string, any> = {}
        if (data.name !== undefined) prismaData.name = data.name
        if (data.description !== undefined) prismaData.description = data.description
        if (data.startDate !== undefined) prismaData.startDate = data.startDate
        if (data.endDate !== undefined) prismaData.endDate = data.endDate
        if (data.location !== undefined) prismaData.location = data.location
        if (data.visible !== undefined) prismaData.visible = data.visible
        if (normalizedImageUrl !== undefined) prismaData.imageUrl = normalizedImageUrl

        const exhibition = await prisma.galleryLjExhibition.update({
            where: { id },
            data: prismaData
        })

        revalidatePath(REVALIDATE_PATH)
        revalidatePath(`/fr/galleryLj/exhibitions/${id}/edit`)
        return { success: true, exhibition }
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'exposition galerie LJ:', error)
        return { success: false, message: (error as Error).message }
    }
}

/**
 * Supprime une exposition galerie LJ ainsi que son image dans Cloudflare R2.
 *
 * La suppression R2 est non-bloquante : si l'objet n'existe pas ou si R2 renvoie
 * une erreur, la suppression en base de données est quand même effectuée.
 */
export async function deleteGalleryLjExhibition(id: number) {
    try {
        const exhibition = await prisma.galleryLjExhibition.findUnique({
            where: { id },
            select: { imageUrl: true }
        })

        if (!exhibition) {
            return { success: false, message: 'Exposition introuvable' }
        }

        // Supprimer l'image R2 avant la suppression en base.
        // imageUrl est stocké en chemin relatif (ex: galleryLj/exhibitions/<slug>/main-image.webp).
        // On utilise toRelativePath() pour gérer les éventuelles URLs absolues legacy.
        if (exhibition.imageUrl) {
            const r2Key = toRelativePath(exhibition.imageUrl) ?? exhibition.imageUrl

            try {
                await r2Client.send(
                    new DeleteObjectCommand({
                        Bucket: R2_BUCKET_NAME,
                        Key: r2Key,
                    })
                )
                console.log(`[deleteGalleryLjExhibition] Image R2 supprimée: ${r2Key}`)
            } catch (r2Error: unknown) {
                // NoSuchKey = fichier déjà absent, on ignore silencieusement
                const err = r2Error as { name?: string; $metadata?: { httpStatusCode?: number } }
                if (err?.name === 'NoSuchKey' || err?.$metadata?.httpStatusCode === 404) {
                    console.log(`[deleteGalleryLjExhibition] Image R2 introuvable (déjà supprimée): ${r2Key}`)
                } else {
                    // Toute autre erreur R2 est loggée mais ne bloque pas la suppression en base
                    console.error(`[deleteGalleryLjExhibition] Erreur R2 lors de la suppression de ${r2Key}:`, r2Error)
                }
            }
        }

        await prisma.galleryLjExhibition.delete({
            where: { id }
        })

        revalidatePath(REVALIDATE_PATH)
        return { success: true }
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'exposition galerie LJ:', error)
        return { success: false, message: (error as Error).message }
    }
}
