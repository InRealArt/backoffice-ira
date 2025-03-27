'use server'

import { prisma } from '@/lib/prisma'
import { ItemCategory } from '@prisma/client'
import { revalidatePath } from 'next/cache'

export async function getItemCategoryById(id: number): Promise<ItemCategory | null> {
    try {
        return await prisma.itemCategory.findUnique({
            where: { id }
        })
    } catch (error) {
        console.error('Erreur lors de la récupération de la catégorie:', error)
        return null
    }
}

export async function updateItemCategory(
    id: number,
    data: Omit<ItemCategory, 'id'>
): Promise<{ success: boolean; message?: string }> {
    try {
        await prisma.itemCategory.update({
            where: { id },
            data
        })

        revalidatePath(`/dataAdministration/itemCategories`)
        revalidatePath(`/dataAdministration/itemCategories/${id}/edit`)

        return { success: true }
    } catch (error: any) {
        console.error('Erreur lors de la mise à jour de la catégorie:', error)

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

export async function createItemCategory(
    data: Omit<ItemCategory, 'id'>
): Promise<{ success: boolean; category?: ItemCategory; message?: string }> {
    try {
        const category = await prisma.itemCategory.create({
            data
        })

        revalidatePath(`/dataAdministration/itemCategories`)

        return {
            success: true,
            category
        }
    } catch (error: any) {
        console.error('Erreur lors de la création de la catégorie:', error)

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

export async function deleteItemCategory(
    id: number
): Promise<{ success: boolean; message?: string }> {
    try {
        // Vérifier si la catégorie est utilisée par des items
        const itemsUsingCategory = await prisma.item.count({
            where: { categoryId: id }
        })

        if (itemsUsingCategory > 0) {
            return {
                success: false,
                message: `Cette catégorie est utilisée par ${itemsUsingCategory} œuvre(s). Veuillez d'abord modifier ces œuvres.`
            }
        }

        await prisma.itemCategory.delete({
            where: { id }
        })

        revalidatePath(`/dataAdministration/itemCategories`)

        return { success: true }
    } catch (error) {
        console.error('Erreur lors de la suppression de la catégorie:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la suppression.'
        }
    }
} 