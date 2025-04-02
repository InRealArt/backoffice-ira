'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { BlogPost } from '@prisma/client'

/**
 * Récupère tous les articles de blog
 */
export async function getAllBlogPosts() {
    try {
        // Si la table n'existe pas encore ou est vide, findMany() retournera un tableau vide au lieu de null
        const blogPosts = await prisma.blogPost.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        }) || []

        // S'assurer que nous retournons toujours un tableau
        return Array.isArray(blogPosts) ? blogPosts : []
    } catch (error) {
        console.error('Erreur lors de la récupération des articles de blog:', error)
        // Toujours retourner un tableau vide en cas d'erreur pour éviter les erreurs "null payload"
        return []
    }
}

/**
 * Récupère un article de blog par son ID
 */
export async function getBlogPostById(id: number) {
    try {
        const blogPost = await prisma.blogPost.findUnique({
            where: { id }
        })

        return blogPost
    } catch (error) {
        console.error('Erreur lors de la récupération de l\'article de blog:', error)
        return null
    }
}

/**
 * Crée un nouvel article de blog
 */
export async function createBlogPost(data: {
    title: string
    text?: string
    imageUrl?: string
    imageAlt?: string
    imageWidth?: number
    imageHeight?: number
    readingTime?: number
    tags?: string
    metaDescription?: string
    metaKeywords?: string
    slug?: string
    auteur?: string
    relatedArticles?: string
}) {
    try {
        const blogPost = await prisma.blogPost.create({
            data: {
                title: data.title,
                slug: data.slug || `article-${Date.now()}`,
                metaDescription: data.metaDescription || data.title,
                metaKeywords: data.metaKeywords ? data.metaKeywords.split(',').map(k => k.trim()) : [],
                author: data.auteur || 'Anonyme',
                datePublished: new Date(),
                featuredImageUrl: data.imageUrl || '',
                featuredImageAlt: data.imageAlt || '',
                featuredImageWidth: data.imageWidth || 0,
                featuredImageHeight: data.imageHeight || 0,
                introduction: '',
                content: data.text || '',
                tags: data.tags ? JSON.parse(data.tags) : [],
                estimatedReadTime: data.readingTime || 1,
                isPublished: false,
                isFeatured: false,
                relatedArticles: data.relatedArticles ? JSON.parse(data.relatedArticles) : []
            }
        })

        revalidatePath('/landing/blog')
        return {
            success: true,
            blogPost
        }
    } catch (error) {
        console.error('Erreur lors de la création de l\'article de blog:', error)
        return {
            success: false,
            message: (error as Error).message
        }
    }
}

/**
 * Met à jour un article de blog existant
 */
export async function updateBlogPost(id: number, data: {
    title?: string
    text?: string
    imageUrl?: string
    imageAlt?: string
    imageWidth?: number
    imageHeight?: number
    readingTime?: number
    tags?: string
    metaDescription?: string
    slug?: string
    auteur?: string
    relatedArticles?: string
}) {
    try {
        const updateData: any = {}

        if (data.title) updateData.title = data.title
        if (data.slug) updateData.slug = data.slug
        if (data.text) updateData.content = data.text
        if (data.imageUrl) updateData.featuredImageUrl = data.imageUrl
        if (data.imageAlt) updateData.featuredImageAlt = data.imageAlt
        if (data.imageWidth) updateData.featuredImageWidth = data.imageWidth
        if (data.imageHeight) updateData.featuredImageHeight = data.imageHeight
        if (data.readingTime) updateData.estimatedReadTime = data.readingTime
        if (data.metaDescription) updateData.metaDescription = data.metaDescription
        if (data.auteur) updateData.author = data.auteur

        // Pour les champs de type JSON ou tableau
        if (data.tags) updateData.tags = JSON.parse(data.tags)
        if (data.relatedArticles) updateData.relatedArticles = JSON.parse(data.relatedArticles)

        // Mise à jour de la date de modification
        updateData.dateModified = new Date()

        const blogPost = await prisma.blogPost.update({
            where: { id },
            data: updateData
        })

        revalidatePath('/landing/blog')
        revalidatePath(`/landing/blog/${id}/edit`)

        return {
            success: true,
            blogPost
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour de l\'article de blog:', error)
        return {
            success: false,
            message: (error as Error).message
        }
    }
}

/**
 * Supprime un article de blog
 */
export async function deleteBlogPost(id: number) {
    try {
        await prisma.blogPost.delete({
            where: { id }
        })

        revalidatePath('/landing/blog')

        return {
            success: true
        }
    } catch (error) {
        console.error('Erreur lors de la suppression de l\'article de blog:', error)
        return {
            success: false,
            message: (error as Error).message
        }
    }
} 