'use server'

import { prisma } from '@/lib/prisma'
import { generateSlug } from '@/lib/utils'
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

async function generateUniqueArtistCategorySlug(base: string, excludeId?: number): Promise<string> {
    let baseSlug = generateSlug(base || '')
    if (!baseSlug) baseSlug = `artist-category-${Date.now()}`

    const existing = await prisma.artistCategory.findFirst({
        where: {
            slug: baseSlug,
            ...(excludeId ? { id: { not: excludeId } } : {})
        }
    })
    if (!existing) return baseSlug

    let counter = 2
    while (true) {
        const candidate = `${baseSlug}-${counter}`
        const conflict = await prisma.artistCategory.findFirst({
            where: {
                slug: candidate,
                ...(excludeId ? { id: { not: excludeId } } : {})
            }
        })
        if (!conflict) return candidate
        counter++
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
        const updateData: any = {
            name: data.name,
            imageUrl: data.imageUrl,
            description: data.description,
            order: data.order
        }

        if (typeof data.name === 'string' && data.name.trim() !== '') {
            updateData.slug = await generateUniqueArtistCategorySlug(data.name, id)
        }

        await prisma.artistCategory.update({
            where: { id },
            data: updateData
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
        const uniqueSlug = await generateUniqueArtistCategorySlug(data.name)
        const newArtistCategory = await prisma.artistCategory.create({
            data: {
                name: data.name,
                imageUrl: data.imageUrl,
                description: data.description,
                order: data.order,
                slug: uniqueSlug
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