'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { SeoCategory } from '@prisma/client'

/**
 * Récupère toutes les catégories d'articles SEO
 */
export async function getAllSeoCategories() {
    try {
        const categories = await prisma.seoCategory.findMany({
            orderBy: {
                name: 'asc'
            },
            include: {
                _count: {
                    select: { posts: true }
                }
            }
        }) || []

        return Array.isArray(categories) ? categories : []
    } catch (error) {
        console.error('Erreur lors de la récupération des catégories SEO:', error)
        return []
    }
}

/**
 * Récupère une catégorie SEO par son ID
 */
export async function getSeoCategoryById(id: number) {
    try {
        const category = await prisma.seoCategory.findUnique({
            where: { id }
        })

        return category
    } catch (error) {
        console.error('Erreur lors de la récupération de la catégorie SEO:', error)
        return null
    }
}

/**
 * Crée une nouvelle catégorie SEO
 */
export async function createSeoCategory(data: {
    name: string
    url?: string
    color?: string
    shortDescription?: string
    longDescription?: string
    textCTA?: string
    linkCTA?: string
}) {
    try {
        const category = await prisma.seoCategory.create({
            data: {
                name: data.name,
                url: data.url,
                color: data.color,
                shortDescription: data.shortDescription,
                longDescription: data.longDescription,
                textCTA: data.textCTA,
                linkCTA: data.linkCTA
            }
        })

        revalidatePath('/landing/blog-categories')
        return {
            success: true,
            category
        }
    } catch (error) {
        console.error('Erreur lors de la création de la catégorie SEO:', error)
        return {
            success: false,
            message: (error as Error).message
        }
    }
}

/**
 * Met à jour une catégorie SEO existante
 */
export async function updateSeoCategory(id: number, data: {
    name?: string
    url?: string
    color?: string
    shortDescription?: string
    longDescription?: string
    textCTA?: string
    linkCTA?: string
}) {
    try {
        const updateData: any = {}

        if (data.name) updateData.name = data.name
        if (data.url !== undefined) updateData.url = data.url
        if (data.color !== undefined) updateData.color = data.color
        if (data.shortDescription !== undefined) updateData.shortDescription = data.shortDescription
        if (data.longDescription !== undefined) updateData.longDescription = data.longDescription
        if (data.textCTA !== undefined) updateData.textCTA = data.textCTA
        if (data.linkCTA !== undefined) updateData.linkCTA = data.linkCTA

        const category = await prisma.seoCategory.update({
            where: { id },
            data: updateData
        })

        revalidatePath('/landing/blog-categories')
        revalidatePath(`/landing/blog-categories/${id}/edit`)

        return {
            success: true,
            category
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour de la catégorie SEO:', error)
        return {
            success: false,
            message: (error as Error).message
        }
    }
}

/**
 * Supprime une catégorie SEO
 */
export async function deleteSeoCategory(id: number) {
    try {
        await prisma.seoCategory.delete({
            where: { id }
        })

        revalidatePath('/landing/blog-categories')

        return {
            success: true
        }
    } catch (error) {
        console.error('Erreur lors de la suppression de la catégorie SEO:', error)
        return {
            success: false,
            message: (error as Error).message
        }
    }
} 