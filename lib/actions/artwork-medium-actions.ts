'use server'

import { prisma } from '@/lib/prisma'
import { ArtworkMedium } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function getArtworkMediumById(id: number): Promise<ArtworkMedium | null> {
    try {
        return await prisma.artworkMedium.findUnique({
            where: { id }
        })
    } catch (error) {
        console.error('Erreur lors de la récupération du medium d\'œuvre:', error)
        return null
    }
}

export async function getAllArtworkMediums(): Promise<ArtworkMedium[]> {
    try {
        const artworkMediums = await prisma.artworkMedium.findMany({
            orderBy: {
                name: 'asc'
            }
        })
        return artworkMediums
    } catch (error) {
        console.error('Erreur lors de la récupération des mediums d\'œuvre:', error)
        return []
    }
}

export async function updateArtworkMedium(
    id: number,
    data: Omit<ArtworkMedium, 'id'>
): Promise<{ success: boolean; message?: string }> {
    try {
        await prisma.artworkMedium.update({
            where: { id },
            data
        })

        revalidatePath(`/dataAdministration/artwork-mediums`)
        revalidatePath(`/dataAdministration/artwork-mediums/${id}/edit`)

        return { success: true }
    } catch (error: any) {
        console.error('Erreur lors de la mise à jour du medium d\'œuvre:', error)

        if (error.code === 'P2002') {
            const field = error.meta?.target?.[0] || 'Un champ'
            return {
                success: false,
                message: `${field} est déjà utilisé. Veuillez en choisir un autre.`
            }
        }

        return {
            success: false,
            message: 'Une erreur est survenue lors de la mise à jour.'
        }
    }
}

export async function createArtworkMedium(
    data: Omit<ArtworkMedium, 'id'>
): Promise<{ success: boolean; message?: string; id?: number }> {
    try {
        const newArtworkMedium = await prisma.artworkMedium.create({
            data
        })

        revalidatePath(`/dataAdministration/artwork-mediums`)

        return {
            success: true,
            id: newArtworkMedium.id
        }
    } catch (error: any) {
        console.error('Erreur lors de la création du medium d\'œuvre:', error)

        if (error.code === 'P2002') {
            const field = error.meta?.target?.[0] || 'Un champ'
            return {
                success: false,
                message: `${field} est déjà utilisé. Veuillez en choisir un autre.`
            }
        }

        return {
            success: false,
            message: 'Une erreur est survenue lors de la création.'
        }
    }
}

export async function deleteArtworkMedium(
    id: number
): Promise<{ success: boolean; message?: string }> {
    try {
        await prisma.artworkMedium.delete({
            where: { id }
        })

        revalidatePath(`/dataAdministration/artwork-mediums`)

        return { success: true }
    } catch (error) {
        console.error('Erreur lors de la suppression du medium d\'œuvre:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la suppression.'
        }
    }
} 