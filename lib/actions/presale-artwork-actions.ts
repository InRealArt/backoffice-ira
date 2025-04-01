'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { PresaleArtwork } from '@prisma/client'

/**
 * Récupère toutes les œuvres en prévente
 */
export async function getAllPresaleArtworks() {
    try {
        const presaleArtworks = await prisma.presaleArtwork.findMany({
            include: {
                artist: true
            },
            orderBy: {
                name: 'asc'
            }
        })

        return presaleArtworks
    } catch (error) {
        console.error('Erreur lors de la récupération des œuvres en prévente:', error)
        return []
    }
}

/**
 * Récupère une œuvre en prévente par son ID
 */
export async function getPresaleArtworkById(id: number) {
    try {
        const presaleArtwork = await prisma.presaleArtwork.findUnique({
            where: { id },
            include: {
                artist: true
            }
        })

        return presaleArtwork
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'œuvre en prévente:', error)
        return null
    }
}

/**
 * Crée une nouvelle œuvre en prévente
 */
export async function createPresaleArtwork(data: {
    name: string
    artistId: number
    price: number
    imageUrl: string
    order?: number
    mockupUrls?: string
}) {
    try {
        const presaleArtwork = await prisma.presaleArtwork.create({
            data: {
                name: data.name,
                artistId: data.artistId,
                price: data.price,
                imageUrl: data.imageUrl,
                order: data.order || null,
                mockupUrls: data.mockupUrls || "[]"
            },
            include: {
                artist: true
            }
        })

        revalidatePath('/presale-artworks')
        return {
            success: true,
            presaleArtwork
        }
    } catch (error) {
        console.error('Erreur lors de la création de l\'œuvre en prévente:', error)
        return {
            success: false,
            message: (error as Error).message
        }
    }
}

/**
 * Met à jour une œuvre en prévente existante
 */
export async function updatePresaleArtwork(id: number, data: {
    name?: string
    artistId?: number
    price?: number
    imageUrl?: string
    order?: number
    mockupUrls?: string
}) {
    try {
        const presaleArtwork = await prisma.presaleArtwork.update({
            where: { id },
            data,
            include: {
                artist: true
            }
        })

        revalidatePath('/presale-artworks')
        revalidatePath(`/presale-artworks/${id}/edit`)

        return {
            success: true,
            presaleArtwork
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'œuvre en prévente:', error)
        return {
            success: false,
            message: (error as Error).message
        }
    }
}

/**
 * Supprime une œuvre en prévente
 */
export async function deletePresaleArtwork(id: number) {
    try {
        await prisma.presaleArtwork.delete({
            where: { id }
        })

        revalidatePath('/presale-artworks')

        return {
            success: true,
            message: 'Œuvre en prévente supprimée avec succès'
        }
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'œuvre en prévente:', error)
        return {
            success: false,
            message: (error as Error).message
        }
    }
} 