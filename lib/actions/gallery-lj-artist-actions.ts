'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { toRelativePath } from '@/lib/r2/url'
import { DeleteObjectCommand } from '@aws-sdk/client-s3'
import { r2Client, R2_BUCKET_NAME } from '@/lib/r2/client'
import sanitizeHtmlLib from 'sanitize-html'
import { generateSlug } from '@/lib/utils'

const REVALIDATE_PATH = '/fr/galleryLj/artists'

/**
 * Sanitize HTML content to prevent XSS attacks.
 * Uses sanitize-html (pure Node.js, no jsdom dependency) instead of
 * isomorphic-dompurify which pulls in jsdom and breaks on Vercel due to
 * a CJS/ESM incompatibility in html-encoding-sniffer / @exodus/bytes.
 */
function sanitizeHtml(html: string | null | undefined): string | null {
    if (!html) return null
    return sanitizeHtmlLib(html, {
        allowedTags: [
            'p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
            'ul', 'ol', 'li', 'a', 'blockquote', 'span', 'div'
        ],
        allowedAttributes: {
            'a': ['href', 'target', 'rel'],
            '*': ['style', 'class'],
        },
    })
}

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
    description?: string | null
    shortDescription?: string | null
    formation?: string | null
    personalExhibitions?: string | null
    collectiveExhibitions?: string | null
    publicCollections?: string | null
    imageUrl?: string | null
    permanent?: boolean
}) {
    try {
        // Slug rule: if pseudo is present, use it; otherwise use firstName-lastName
        const slugSource = data.pseudo && data.pseudo.trim().length > 0
            ? data.pseudo
            : `${data.firstName || ''} ${data.lastName || ''}`.trim()
        const slug = generateSlug(slugSource)

        const artist = await prisma.galleryLjArtist.create({
            data: {
                pseudo: data.pseudo,
                firstName: data.firstName ?? null,
                lastName: data.lastName ?? null,
                slug,
                description: sanitizeHtml(data.description),
                shortDescription: data.shortDescription ?? null,
                formation: sanitizeHtml(data.formation),
                personalExhibitions: sanitizeHtml(data.personalExhibitions),
                collectiveExhibitions: sanitizeHtml(data.collectiveExhibitions),
                publicCollections: sanitizeHtml(data.publicCollections),
                imageUrl: data.imageUrl ? (toRelativePath(data.imageUrl) ?? data.imageUrl) : null,
                permanent: data.permanent ?? true
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
        description?: string | null
        shortDescription?: string | null
        formation?: string | null
        personalExhibitions?: string | null
        collectiveExhibitions?: string | null
        publicCollections?: string | null
        imageUrl?: string | null
        permanent?: boolean
    }
) {
    try {
        const updateData: typeof data & { imageUrl?: string | null; slug?: string } = { ...data }

        if (updateData.imageUrl !== undefined) {
            updateData.imageUrl = updateData.imageUrl
                ? (toRelativePath(updateData.imageUrl) ?? updateData.imageUrl)
                : null
        }

        // Regenerate slug if pseudo, firstName ou lastName changes
        if (updateData.pseudo !== undefined || updateData.firstName !== undefined || updateData.lastName !== undefined) {
            const artist = await prisma.galleryLjArtist.findUnique({ where: { id }, select: { pseudo: true, firstName: true, lastName: true } })
            const pseudo = updateData.pseudo ?? artist?.pseudo
            const firstName = updateData.firstName ?? artist?.firstName
            const lastName = updateData.lastName ?? artist?.lastName
            
            // Slug rule: if pseudo is present, use it; otherwise use firstName-lastName
            const slugSource = pseudo && pseudo.trim().length > 0
                ? pseudo
                : `${firstName || ''} ${lastName || ''}`.trim()
            updateData.slug = generateSlug(slugSource)
        }

        // Sanitize HTML fields if present
        if (updateData.description !== undefined) {
            updateData.description = sanitizeHtml(updateData.description)
        }
        if (updateData.formation !== undefined) {
            updateData.formation = sanitizeHtml(updateData.formation)
        }
        if (updateData.personalExhibitions !== undefined) {
            updateData.personalExhibitions = sanitizeHtml(updateData.personalExhibitions)
        }
        if (updateData.collectiveExhibitions !== undefined) {
            updateData.collectiveExhibitions = sanitizeHtml(updateData.collectiveExhibitions)
        }
        if (updateData.publicCollections !== undefined) {
            updateData.publicCollections = sanitizeHtml(updateData.publicCollections)
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
 * Supprime un objet R2 de façon non-bloquante.
 * NoSuchKey / 404 sont silencieux. Toute autre erreur est loggée mais n'interrompt pas le flux.
 */
async function deleteR2ObjectSafe(key: string, context: string): Promise<void> {
    try {
        await r2Client.send(
            new DeleteObjectCommand({
                Bucket: R2_BUCKET_NAME,
                Key: key,
            })
        )
        console.log(`[${context}] Image R2 supprimée: ${key}`)
    } catch (r2Error: unknown) {
        const err = r2Error as { name?: string; $metadata?: { httpStatusCode?: number } }
        if (err?.name === 'NoSuchKey' || err?.$metadata?.httpStatusCode === 404) {
            console.log(`[${context}] Image R2 introuvable (déjà supprimée): ${key}`)
        } else {
            console.error(`[${context}] Erreur R2 lors de la suppression de ${key}:`, r2Error)
        }
    }
}

/**
 * Met à jour l'ordre d'affichage des artistes de la galerie LJ
 */
export async function updateGalleryLjArtistsOrder(
    updates: Array<{ id: number; order: number }>
) {
    try {
        await prisma.$transaction(
            updates.map((update) =>
                prisma.galleryLjArtist.update({
                    where: { id: update.id },
                    data: { order: update.order }
                })
            )
        )
        revalidatePath(REVALIDATE_PATH)
        return { success: true }
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'ordre des artistes:', error)
        return { success: false, message: (error as Error).message }
    }
}

/**
 * Supprime un artiste galerie LJ ainsi que son image et les images de ses œuvres dans Cloudflare R2.
 *
 * Ordre des opérations :
 * 1. Récupérer l'artiste + ses artworks avant suppression
 * 2. Supprimer les images R2 des artworks (non-bloquant)
 * 3. Supprimer l'image R2 de l'artiste (non-bloquant)
 * 4. Supprimer les artworks en base (FK oblige à supprimer avant l'artiste)
 * 5. Supprimer l'artiste en base
 *
 * Les suppressions R2 sont non-bloquantes : une erreur R2 ne bloque pas la suppression en base.
 */
export async function deleteGalleryLjArtist(id: number) {
    try {
        const artist = await prisma.galleryLjArtist.findUnique({
            where: { id },
            select: {
                imageUrl: true,
                artworks: {
                    select: { id: true, imageUrl: true }
                }
            }
        })

        if (!artist) {
            return { success: false, message: 'Artiste introuvable' }
        }

        // Supprimer les images R2 des artworks associés
        await Promise.all(
            artist.artworks
                .filter((aw) => !!aw.imageUrl)
                .map((aw) => {
                    const r2Key = toRelativePath(aw.imageUrl) ?? aw.imageUrl
                    return deleteR2ObjectSafe(r2Key, 'deleteGalleryLjArtist/artwork')
                })
        )

        // Supprimer l'image R2 de l'artiste
        if (artist.imageUrl) {
            const r2Key = toRelativePath(artist.imageUrl) ?? artist.imageUrl
            await deleteR2ObjectSafe(r2Key, 'deleteGalleryLjArtist')
        }

        // Supprimer les entrées de jonction exposition↔œuvre (pas de cascade DB configurée)
        if (artist.artworks.length > 0) {
            const artworkIds = artist.artworks.map((aw) => aw.id)
            await prisma.galleryLjExhibitionArtwork.deleteMany({
                where: { artworkId: { in: artworkIds } }
            })
        }

        // Supprimer les artworks en base (pas de cascade DB configurée)
        if (artist.artworks.length > 0) {
            await prisma.galleryLjArtwork.deleteMany({
                where: { artistId: id }
            })
        }

        // Supprimer l'artiste en base
        await prisma.galleryLjArtist.delete({
            where: { id }
        })

        revalidatePath(REVALIDATE_PATH)
        return { success: true }
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'artiste galerie LJ:', error)
        return { success: false, message: (error as Error).message }
    }
}
