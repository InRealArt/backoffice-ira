'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { toRelativePath } from '@/lib/r2/url'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { r2Client, R2_BUCKET_NAME } from '@/lib/r2/client'

const REVALIDATE_PATH = '/fr/galleryLj/hero'

/**
 * Récupère tous les héros de la galerie LJ
 */
export async function getAllGalleryLjHeroes() {
    try {
        const heroes = await prisma.galleryLjHero.findMany({
            orderBy: {
                id: 'asc'
            }
        })
        return heroes
    } catch (error) {
        console.error('Erreur lors de la récupération des héros galerie LJ:', error)
        return []
    }
}

/**
 * Récupère un héro galerie LJ par son ID
 */
export async function getGalleryLjHeroById(id: number) {
    try {
        const hero = await prisma.galleryLjHero.findUnique({
            where: { id }
        })
        return hero ?? null
    } catch (error) {
        console.error('Erreur lors de la récupération du héro galerie LJ:', error)
        return null
    }
}

/**
 * Crée un nouveau héro dans la galerie LJ
 */
export async function createGalleryLjHero(data: {
    image: string
    title: string
    text?: string | null
    ctaUrl?: string | null
}) {
    try {
        const existingHeroesCount = await prisma.galleryLjHero.count()
        if (existingHeroesCount >= 1) {
            return {
                success: false,
                message: 'Un seul héro est autorisé pour la galerie LJ.'
            }
        }

        const hero = await prisma.galleryLjHero.create({
            data: {
                image: toRelativePath(data.image) ?? data.image,
                title: data.title,
                text: data.text ?? null,
                ctaUrl: data.ctaUrl ?? null
            }
        })

        revalidatePath(REVALIDATE_PATH)
        return { success: true, hero }
    } catch (error) {
        console.error('Erreur lors de la création du héro galerie LJ:', error)
        return { success: false, message: (error as Error).message }
    }
}

/**
 * Met à jour un héro galerie LJ existant
 */
export async function updateGalleryLjHero(
    id: number,
    data: {
        image?: string
        title?: string
        text?: string | null
        ctaUrl?: string | null
    }
) {
    try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const prismaData: Record<string, any> = {}
        if (data.image !== undefined) prismaData.image = toRelativePath(data.image) ?? data.image
        if (data.title !== undefined) prismaData.title = data.title
        if (data.text !== undefined) prismaData.text = data.text
        if (data.ctaUrl !== undefined) prismaData.ctaUrl = data.ctaUrl

        const hero = await prisma.galleryLjHero.update({
            where: { id },
            data: prismaData
        })

        revalidatePath(REVALIDATE_PATH)
        revalidatePath(`/fr/galleryLj/hero/${id}/edit`)
        return { success: true, hero }
    } catch (error) {
        console.error('Erreur lors de la mise à jour du héro galerie LJ:', error)
        return { success: false, message: (error as Error).message }
    }
}

/**
 * Supprime un héro galerie LJ ainsi que son image dans Cloudflare R2.
 *
 * La suppression R2 est non-bloquante : si l'objet n'existe pas ou si R2 renvoie
 * une erreur, la suppression en base de données est quand même effectuée.
 */
export async function deleteGalleryLjHero(id: number) {
    try {
        const hero = await prisma.galleryLjHero.findUnique({
            where: { id },
            select: { image: true }
        })

        if (!hero) {
            return { success: false, message: 'Héro introuvable' }
        }

        // Supprimer l'image R2 avant la suppression en base.
        if (hero.image) {
            const r2Key = toRelativePath(hero.image) ?? hero.image

            try {
                await r2Client.send(
                    new DeleteObjectCommand({
                        Bucket: R2_BUCKET_NAME,
                        Key: r2Key,
                    })
                )
                console.log(`[deleteGalleryLjHero] Image R2 supprimée: ${r2Key}`)
            } catch (r2Error: unknown) {
                const err = r2Error as { name?: string; $metadata?: { httpStatusCode?: number } }
                if (err?.name === 'NoSuchKey' || err?.$metadata?.httpStatusCode === 404) {
                    console.log(`[deleteGalleryLjHero] Image R2 introuvable (déjà supprimée): ${r2Key}`)
                } else {
                    console.error(`[deleteGalleryLjHero] Erreur R2 lors de la suppression de ${r2Key}:`, r2Error)
                }
            }
        }

        await prisma.galleryLjHero.delete({
            where: { id }
        })

        revalidatePath(REVALIDATE_PATH)
        return { success: true }
    } catch (error) {
        console.error('Erreur lors de la suppression du héro galerie LJ:', error)
        return { success: false, message: (error as Error).message }
    }
}
