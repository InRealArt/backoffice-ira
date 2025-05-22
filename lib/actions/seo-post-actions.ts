'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { SeoPost } from '@prisma/client'

export async function getAllSeoPosts() {
    try {
        const seoPosts = await prisma.seoPost.findMany({
            include: {
                category: true,
                tags: {
                    include: {
                        tag: true
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        })

        return seoPosts
    } catch (error) {
        console.error('Erreur lors de la récupération des articles SEO:', error)
        throw new Error('Impossible de récupérer les articles SEO')
    }
}

export async function getSeoPostById(id: number) {
    try {
        const seoPost = await prisma.seoPost.findUnique({
            where: { id },
            include: {
                category: true,
                tags: {
                    include: {
                        tag: true
                    }
                }
            }
        })

        return seoPost
    } catch (error) {
        console.error(`Erreur lors de la récupération de l'article SEO ${id}:`, error)
        return null
    }
}

export async function createSeoPost(data: Omit<SeoPost, 'id' | 'createdAt' | 'updatedAt' | 'viewsCount' | 'generatedHtml' | 'generatedArticleHtml' | 'jsonLd'>) {
    try {
        const seoPost = await prisma.seoPost.create({
            data
        })

        revalidatePath('/landing/seo-posts')
        return {
            success: true,
            seoPost
        }
    } catch (error) {
        console.error('Erreur lors de la création de l\'article SEO:', error)
        return {
            success: false,
            message: (error as Error).message
        }
    }
}

export async function updateSeoPost(id: number, data: Partial<Omit<SeoPost, 'id' | 'createdAt' | 'updatedAt'>>) {
    try {
        const seoPost = await prisma.seoPost.update({
            where: { id },
            data
        })

        revalidatePath('/landing/seo-posts')
        revalidatePath(`/landing/seo-posts/${id}/edit`)

        return {
            success: true,
            seoPost
        }
    } catch (error) {
        console.error(`Erreur lors de la mise à jour de l'article SEO ${id}:`, error)
        return {
            success: false,
            message: (error as Error).message
        }
    }
} 