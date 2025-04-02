'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { BlogPost } from '@prisma/client'

/**
 * Récupère tous les articles de blog
 */
export async function getAllBlogPosts() {
    try {
        const blogPosts = await prisma.blogPost.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        })

        return blogPosts
    } catch (error) {
        console.error('Erreur lors de la récupération des articles de blog:', error)
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
    text: string
    imageUrl: string
    readingTime: number
    tags?: string
}) {
    try {
        const blogPost = await prisma.blogPost.create({
            data: {
                title: data.title,
                text: data.text,
                imageUrl: data.imageUrl,
                readingTime: data.readingTime,
                tags: data.tags || "[]"
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
    readingTime?: number
    tags?: string
}) {
    try {
        const blogPost = await prisma.blogPost.update({
            where: { id },
            data
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