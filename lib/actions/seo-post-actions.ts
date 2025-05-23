'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { SeoPost } from '@prisma/client'
import { generateSeoJsonLd, generateSeoHtml, generateArticleHtml, SeoPostData } from '@/lib/utils/seo-generators'
import { BlogContent } from '@/app/components/BlogEditor/types'

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

export async function createSeoPost(data: {
    title: string
    categoryId: number
    metaDescription: string
    metaKeywords: string[]
    slug: string
    content: string
    excerpt?: string
    author: string
    authorLink?: string
    estimatedReadTime?: number | null
    status: 'DRAFT' | 'PUBLISHED'
    pinned?: boolean
    mainImageUrl?: string
    mainImageAlt?: string
    mainImageCaption?: string
    creationDate?: Date
}) {
    try {
        // Parser le contenu JSON pour obtenir le BlogContent
        let blogContent: BlogContent = []
        try {
            blogContent = JSON.parse(data.content)
        } catch (error) {
            console.error('Erreur lors du parsing du contenu:', error)
            // Si le parsing échoue, créer un contenu par défaut
            blogContent = []
        }

        // Préparer les données pour la génération SEO
        const seoPostData: SeoPostData = {
            title: data.title,
            metaDescription: data.metaDescription,
            author: data.author,
            authorLink: data.authorLink,
            mainImageUrl: data.mainImageUrl,
            mainImageAlt: data.mainImageAlt,
            mainImageCaption: data.mainImageCaption,
            creationDate: data.creationDate || new Date(),
            excerpt: data.excerpt,
            blogContent: blogContent,
            tags: data.metaKeywords || []
        }

        // Générer le JSON-LD, HTML complet et HTML de l'article
        const jsonLd = generateSeoJsonLd(seoPostData)
        const generatedHtml = generateSeoHtml(seoPostData)
        const generatedArticleHtml = generateArticleHtml(seoPostData)

        // Créer l'article
        const seoPost = await prisma.seoPost.create({
            data: {
                title: data.title,
                categoryId: data.categoryId,
                metaDescription: data.metaDescription,
                metaKeywords: data.metaKeywords || [],
                slug: data.slug,
                content: data.content, // Stocker le JSON du blog content
                excerpt: data.excerpt,
                author: data.author,
                authorLink: data.authorLink,
                estimatedReadTime: data.estimatedReadTime,
                status: data.status,
                pinned: data.pinned || false,
                mainImageUrl: data.mainImageUrl,
                mainImageAlt: data.mainImageAlt,
                mainImageCaption: data.mainImageCaption,
                createdAt: data.creationDate,
                jsonLd: jsonLd,
                generatedHtml: generatedHtml,
                generatedArticleHtml: generatedArticleHtml
            }
        })

        // Mettre à jour le champ listTags avec une requête SQL brute
        if (data.metaKeywords && data.metaKeywords.length > 0) {
            await prisma.$executeRaw`
                UPDATE "landing"."SeoPost" 
                SET "listTags" = ${data.metaKeywords}::text[] 
                WHERE id = ${seoPost.id}
            `
        }

        // Gérer les tags - créer les relations SeoPostTag
        if (data.metaKeywords && data.metaKeywords.length > 0) {
            // Créer les relations SeoPostTag (cohérence avec listTags)
            await Promise.all(data.metaKeywords.map(async (tagName) => {
                // Créer ou récupérer le tag
                const tag = await prisma.seoTag.upsert({
                    where: { name: tagName },
                    update: {},
                    create: {
                        name: tagName,
                        slug: tagName.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-')
                    }
                })

                // Créer la relation
                await prisma.seoPostTag.create({
                    data: {
                        postId: seoPost.id,
                        tagId: tag.id
                    }
                })
            }))
        }

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

export async function updateSeoPost(id: number, data: {
    title?: string
    categoryId?: number
    metaDescription?: string
    metaKeywords?: string[]
    slug?: string
    content?: string
    excerpt?: string
    author?: string
    authorLink?: string
    estimatedReadTime?: number | null
    status?: 'DRAFT' | 'PUBLISHED'
    pinned?: boolean
    mainImageUrl?: string
    mainImageAlt?: string
    mainImageCaption?: string
    creationDate?: Date
}) {
    try {
        // Récupérer l'article existant
        const existingPost = await prisma.seoPost.findUnique({
            where: { id },
            include: {
                tags: {
                    include: {
                        tag: true
                    }
                }
            }
        })

        if (!existingPost) {
            return {
                success: false,
                message: 'Article non trouvé'
            }
        }

        // Parser le contenu JSON pour obtenir le BlogContent
        let blogContent: BlogContent = []
        try {
            blogContent = JSON.parse(data.content || existingPost.content)
        } catch (error) {
            console.error('Erreur lors du parsing du contenu:', error)
            blogContent = []
        }

        // Préparer les données pour la génération SEO en mélangeant les nouvelles données avec les existantes
        const seoPostData: SeoPostData = {
            title: data.title || existingPost.title,
            metaDescription: data.metaDescription || existingPost.metaDescription,
            author: data.author || existingPost.author,
            authorLink: data.authorLink || existingPost.authorLink || undefined,
            mainImageUrl: data.mainImageUrl || existingPost.mainImageUrl || undefined,
            mainImageAlt: data.mainImageAlt || existingPost.mainImageAlt || undefined,
            mainImageCaption: data.mainImageCaption || existingPost.mainImageCaption || undefined,
            creationDate: data.creationDate || existingPost.createdAt,
            excerpt: data.excerpt || existingPost.excerpt || undefined,
            blogContent: blogContent,
            tags: data.metaKeywords || existingPost.metaKeywords || []
        }

        // Générer le JSON-LD, HTML complet et HTML de l'article
        const jsonLd = generateSeoJsonLd(seoPostData)
        const generatedHtml = generateSeoHtml(seoPostData)
        const generatedArticleHtml = generateArticleHtml(seoPostData)

        // Préparer les données pour la mise à jour
        const updateData: any = {
            jsonLd: jsonLd,
            generatedHtml: generatedHtml,
            generatedArticleHtml: generatedArticleHtml
        }

        // Ajouter les champs de base s'ils sont fournis
        if (data.title !== undefined) updateData.title = data.title
        if (data.metaDescription !== undefined) updateData.metaDescription = data.metaDescription
        // Stocker le même tableau de tags dans metaKeywords et listTags
        if (data.metaKeywords !== undefined) {
            updateData.metaKeywords = data.metaKeywords || []
            // Note: listTags sera mis à jour après avec une requête SQL brute
        }
        if (data.slug !== undefined) updateData.slug = data.slug
        if (data.content !== undefined) updateData.content = data.content
        if (data.excerpt !== undefined) updateData.excerpt = data.excerpt
        if (data.author !== undefined) updateData.author = data.author
        if (data.authorLink !== undefined) updateData.authorLink = data.authorLink
        if (data.estimatedReadTime !== undefined) updateData.estimatedReadTime = data.estimatedReadTime
        if (data.status !== undefined) updateData.status = data.status
        if (data.pinned !== undefined) updateData.pinned = data.pinned
        if (data.mainImageUrl !== undefined) updateData.mainImageUrl = data.mainImageUrl
        if (data.mainImageAlt !== undefined) updateData.mainImageAlt = data.mainImageAlt
        if (data.mainImageCaption !== undefined) updateData.mainImageCaption = data.mainImageCaption
        if (data.creationDate !== undefined) updateData.createdAt = data.creationDate

        // Gérer la relation category si categoryId est fourni
        if (data.categoryId !== undefined) {
            updateData.category = {
                connect: { id: data.categoryId }
            }
        }

        // Mettre à jour l'article
        const seoPost = await prisma.seoPost.update({
            where: { id },
            data: updateData
        })

        // Mettre à jour le champ listTags avec une requête SQL brute si les tags ont changé
        if (data.metaKeywords !== undefined) {
            const listTagsArray = data.metaKeywords || []

            await prisma.$executeRaw`
                UPDATE "landing"."SeoPost" 
                SET "listTags" = ${listTagsArray}::text[] 
                WHERE id = ${id}
            `

            // Gérer la mise à jour des relations SeoPostTag
            // Supprimer toutes les relations de tags existantes
            await prisma.seoPostTag.deleteMany({
                where: { postId: id }
            })

            // Créer les nouvelles relations de tags (cohérence avec listTags)
            if (data.metaKeywords && data.metaKeywords.length > 0) {
                await Promise.all(data.metaKeywords.map(async (tagName) => {
                    // Créer ou récupérer le tag
                    const tag = await prisma.seoTag.upsert({
                        where: { name: tagName },
                        update: {},
                        create: {
                            name: tagName,
                            slug: tagName.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-')
                        }
                    })

                    // Créer la relation
                    await prisma.seoPostTag.create({
                        data: {
                            postId: id,
                            tagId: tag.id
                        }
                    })
                }))
            }
        }

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

export async function pinSeoPost(id: number) {
    try {
        // Vérifier que l'article existe
        const existingPost = await prisma.seoPost.findUnique({
            where: { id }
        })

        if (!existingPost) {
            return {
                success: false,
                message: 'Article non trouvé'
            }
        }

        // Dépingler tous les autres articles
        await prisma.seoPost.updateMany({
            where: {
                id: { not: id },
                pinned: true
            },
            data: {
                pinned: false
            }
        })

        // Épingler l'article ciblé
        const seoPost = await prisma.seoPost.update({
            where: { id },
            data: {
                pinned: true
            }
        })

        revalidatePath('/landing/seo-posts')
        revalidatePath(`/landing/seo-posts/${id}/edit`)

        return {
            success: true,
            seoPost
        }
    } catch (error) {
        console.error(`Erreur lors de l'épinglage de l'article SEO ${id}:`, error)
        return {
            success: false,
            message: (error as Error).message
        }
    }
} 