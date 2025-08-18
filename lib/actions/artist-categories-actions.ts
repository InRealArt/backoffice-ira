'use server'

import { prisma } from '@/lib/prisma'
import { ArtistCategory } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function getArtistCategoryById(id: number): Promise<ArtistCategory | null> {
    try {
        return await prisma.artistCategory.findUnique({
            where: { id }
        })
    } catch (error) {
        console.error('Erreur lors de la récupération de la catégorie d\'artiste:', error)
        return null
    }
}

export async function getAllArtistCategories(): Promise<ArtistCategory[]> {
    try {
        const artistCategories = await prisma.artistCategory.findMany({
            orderBy: {
                name: 'asc'
            }
        })
        return artistCategories
    } catch (error) {
        console.error('Erreur lors de la récupération des catégories d\'artistes:', error)
        return []
    }
}

export async function updateArtistCategory(
    id: number,
    data: {
        name?: string
        imageUrl?: string | null
        description?: string | null
        order?: number | null
    }
): Promise<{ success: boolean; message?: string }> {
    try {
        await prisma.artistCategory.update({
            where: { id },
            data: {
                name: data.name,
                imageUrl: data.imageUrl,
                description: data.description,
                order: data.order
            }
        })

        revalidatePath(`/dataAdministration/artist-categories`)
        revalidatePath(`/dataAdministration/artist-categories/${id}/edit`)

        return { success: true }
    } catch (error: any) {
        console.error('Erreur lors de la mise à jour de la catégorie d\'artiste:', error)

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

export async function createArtistCategory(
    data: {
        name: string
        imageUrl?: string | null
        description?: string | null
        order?: number | null
    }
): Promise<{ success: boolean; message?: string; id?: number }> {
    try {
        const newArtistCategory = await prisma.artistCategory.create({
            data: {
                name: data.name,
                imageUrl: data.imageUrl,
                description: data.description,
                order: data.order
            }
        })

        revalidatePath(`/dataAdministration/artist-categories`)

        return {
            success: true,
            id: newArtistCategory.id
        }
    } catch (error: any) {
        console.error('Erreur lors de la création de la catégorie d\'artiste:', error)

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

export async function deleteArtistCategory(
    id: number
): Promise<{ success: boolean; message?: string }> {
    try {
        await prisma.artistCategory.delete({
            where: { id }
        })

        revalidatePath(`/dataAdministration/artist-categories`)

        return { success: true }
    } catch (error) {
        console.error('Erreur lors de la suppression de la catégorie d\'artiste:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la suppression.'
        }
    }
} 