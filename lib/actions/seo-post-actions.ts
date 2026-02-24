'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { SeoPost } from '@/src/generated/prisma/client'
import { generateSeoJsonLd, generateSeoHtml, generateArticleHtml, SeoPostData } from '@/lib/utils/seo-generators'
import { BlogContent } from '@/app/components/BlogEditor/types'
import { translateSeoPostFields, getLanguageByCode, checkTranslationExists, handleSeoPostTranslationsOnUpdate } from '@/lib/services/translation-service'
import { calculateReadingTime } from '@/lib/utils/reading-time-calculator'

export async function getAllSeoPosts() {
    try {
        const seoPosts = await prisma.seoPost.findMany({
            include: {
                language: true,
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
    listTags?: string[]
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
    languageId?: number
    originalPostId?: number
    autoTranslate?: boolean
    targetLanguageCodes?: string[]
}) {
    try {
        // Si pas de languageId fourni, utiliser la langue par défaut
        let languageId = data.languageId
        if (!languageId) {
            const defaultLanguage = await prisma.language.findFirst({
                where: { isDefault: true }
            })
            languageId = defaultLanguage?.id || 1 // fallback à 1 si pas de défaut trouvé
        }

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

        // Générer le HTML initial pour calculer le temps de lecture
        const initialGeneratedHtml = generateSeoHtml(seoPostData)

        // Calculer automatiquement le temps de lecture basé sur le HTML généré
        const calculatedReadingTime = calculateReadingTime(initialGeneratedHtml)

        // Préparer les données pour la génération SEO avec le temps de lecture
        const seoPostDataWithReadTime: SeoPostData = {
            ...seoPostData,
            estimatedReadTime: calculatedReadingTime
        }

        // Générer le JSON-LD, HTML complet et HTML de l'article avec le temps de lecture
        const jsonLd = generateSeoJsonLd(seoPostDataWithReadTime)
        const generatedHtmlWithReadTime = generateSeoHtml(seoPostDataWithReadTime)
        const generatedArticleHtmlWithReadTime = generateArticleHtml(seoPostDataWithReadTime)

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
                authorLink: data.authorLink ?? undefined,
                estimatedReadTime: calculatedReadingTime, // Utiliser le temps calculé automatiquement
                status: data.status,
                pinned: data.pinned || false,
                mainImageUrl: data.mainImageUrl ?? undefined,
                mainImageAlt: data.mainImageAlt,
                mainImageCaption: data.mainImageCaption,
                createdAt: data.creationDate,
                jsonLd: jsonLd,
                generatedHtml: generatedHtmlWithReadTime,
                generatedArticleHtml: generatedArticleHtmlWithReadTime,
                languageId: languageId,
                originalPostId: data.originalPostId || null
            }
        })

        // Mettre à jour le champ listTags avec les vrais tags (pas les keywords)
        if (data.listTags && data.listTags.length > 0) {
            await prisma.$executeRaw`
                UPDATE "landing"."SeoPost" 
                SET "listTags" = ${data.listTags}::text[] 
                WHERE id = ${seoPost.id}
            `
        }

        // Gérer les tags - créer les relations SeoPostTag avec listTags (pas metaKeywords)
        if (data.listTags && data.listTags.length > 0) {
            // Créer les relations SeoPostTag avec les vrais tags
            await Promise.all(data.listTags.map(async (tagName) => {
                // Générer un slug unique pour le tag
                const baseSlug = tagName.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-')

                // Créer ou récupérer le tag en utilisant le slug comme clé unique
                const tag = await prisma.seoTag.upsert({
                    where: { slug: baseSlug },
                    update: {
                        name: tagName // Mettre à jour le nom si le slug existe déjà
                    },
                    create: {
                        name: tagName,
                        slug: baseSlug
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

        console.log("data.autoTranslate : ", data.autoTranslate)
        console.log("data.targetLanguageCodes : ", data.targetLanguageCodes)
        console.log("data.originalPostId : ", data.originalPostId)

        // TRADUCTION AUTOMATIQUE : Gérer les traductions dans les autres langues
        // Seulement si le post créé est un post original (originalPostId === null) et que l'auto-traduction est activée
        const isOriginalPost = !data.originalPostId
        const shouldAutoTranslate = data.autoTranslate && isOriginalPost

        console.log('🔍 Vérification pour traduction automatique lors de la création:')
        console.log(`   - Post ID: ${seoPost.id}`)
        console.log(`   - Est un post original (pivot): ${isOriginalPost}`)
        console.log(`   - originalPostId: ${data.originalPostId || 'null'}`)
        console.log(`   - Auto-traduction demandée: ${data.autoTranslate}`)
        console.log(`   - Langues cibles: ${data.targetLanguageCodes?.join(', ') || 'aucune'}`)
        console.log(`   - Doit traduire: ${shouldAutoTranslate}`)

        if (shouldAutoTranslate) {
            console.log('✅ Conditions remplies pour la traduction automatique')

            // Préparer les champs à traduire
            const fieldsToTranslate = {
                title: data.title,
                metaDescription: data.metaDescription,
                metaKeywords: data.metaKeywords || [],
                content: data.content,
                excerpt: data.excerpt || '',
                listTags: data.listTags || [],
                mainImageAlt: data.mainImageAlt || '',
                mainImageCaption: data.mainImageCaption || '',
                // IMPORTANT: Inclure les champs HTML générés
                generatedHtml: generatedHtmlWithReadTime || '',
                jsonLd: jsonLd || '',
                generatedArticleHtml: generatedArticleHtmlWithReadTime || '',
                // Champs à synchroniser
                status: data.status,
                pinned: data.pinned || false
            }

            console.log('🔄 Lancement de la traduction automatique avec champs HTML')
            console.log(`   - generatedHtml: ${fieldsToTranslate.generatedHtml ? 'Présent' : 'Absent'}`)
            console.log(`   - jsonLd: ${fieldsToTranslate.jsonLd ? 'Présent' : 'Absent'}`)
            console.log(`   - generatedArticleHtml: ${fieldsToTranslate.generatedArticleHtml ? 'Présent' : 'Absent'}`)

            // Lancer la traduction automatique de manière asynchrone pour ne pas bloquer la réponse
            handleSeoPostTranslationsOnUpdate(seoPost.id, fieldsToTranslate)
                .then(result => {
                    if (result.success) {
                        console.log(`✅ Traductions automatiques lors de la création: ${result.message}`)
                    } else {
                        console.error('❌ Erreur lors des traductions automatiques:', result.message)
                    }
                })
                .catch(error => {
                    console.error('❌ Erreur lors des traductions automatiques:', error)
                })
        } else {
            if (!isOriginalPost) {
                console.log('⏭️  Traduction automatique ignorée: ce post est une traduction (originalPostId !== null)')
            }
            if (!data.autoTranslate) {
                console.log('⏭️  Traduction automatique ignorée: auto-traduction non demandée')
            }
        }

        revalidatePath('/landing/seo-posts')
        return {
            success: true,
            seoPost
        }
    } catch (error) {
        console.error('Erreur lors de la création de l\'article SEO:', error || 'Erreur inconnue')
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Une erreur inconnue est survenue'
        }
    }
}

export async function updateSeoPost(id: number, data: {
    title?: string
    categoryId?: number
    metaDescription?: string
    metaKeywords?: string[]
    listTags?: string[]
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
            authorLink: (data.authorLink || existingPost.authorLink) ?? undefined,
            mainImageUrl: (data.mainImageUrl || existingPost.mainImageUrl) ?? undefined,
            mainImageAlt: data.mainImageAlt || existingPost.mainImageAlt || undefined,
            mainImageCaption: data.mainImageCaption || existingPost.mainImageCaption || undefined,
            creationDate: data.creationDate || existingPost.createdAt,
            excerpt: data.excerpt || existingPost.excerpt || undefined,
            blogContent: blogContent,
            tags: data.metaKeywords || existingPost.metaKeywords || []
        }

        // Générer le HTML initial pour calculer le temps de lecture
        const initialGeneratedHtml = generateSeoHtml(seoPostData)

        // Calculer automatiquement le temps de lecture basé sur le HTML généré
        const calculatedReadingTime = calculateReadingTime(initialGeneratedHtml)

        // Préparer les données pour la génération SEO avec le temps de lecture
        const seoPostDataWithReadTime: SeoPostData = {
            ...seoPostData,
            estimatedReadTime: calculatedReadingTime
        }

        // Générer le JSON-LD, HTML complet et HTML de l'article avec le temps de lecture
        const jsonLd = generateSeoJsonLd(seoPostDataWithReadTime)
        const generatedHtmlWithReadTime = generateSeoHtml(seoPostDataWithReadTime)
        const generatedArticleHtmlWithReadTime = generateArticleHtml(seoPostDataWithReadTime)

        // Préparer les données pour la mise à jour
        const updateData: any = {
            jsonLd: jsonLd,
            generatedHtml: generatedHtmlWithReadTime,
            generatedArticleHtml: generatedArticleHtmlWithReadTime,
            estimatedReadTime: calculatedReadingTime // Toujours mettre à jour le temps de lecture calculé
        }

        // Ajouter les champs de base s'ils sont fournis
        if (data.title !== undefined) updateData.title = data.title
        if (data.metaDescription !== undefined) updateData.metaDescription = data.metaDescription
        // Gérer séparément metaKeywords et listTags
        if (data.metaKeywords !== undefined) {
            updateData.metaKeywords = data.metaKeywords || []
        }
        if (data.slug !== undefined) updateData.slug = data.slug
        if (data.content !== undefined) updateData.content = data.content
        if (data.excerpt !== undefined) updateData.excerpt = data.excerpt
        if (data.author !== undefined) updateData.author = data.author
        if (data.authorLink !== undefined) updateData.authorLink = data.authorLink ?? undefined
        if (data.status !== undefined) updateData.status = data.status
        if (data.pinned !== undefined) updateData.pinned = data.pinned
        if (data.mainImageUrl !== undefined) updateData.mainImageUrl = data.mainImageUrl ?? undefined
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

        // Mettre à jour le champ listTags avec les vrais tags (si fournis)
        if (data.listTags !== undefined) {
            const listTagsArray = data.listTags || []

            await prisma.$executeRaw`
                UPDATE "landing"."SeoPost" 
                SET "listTags" = ${listTagsArray}::text[] 
                WHERE id = ${id}
            `

            // Gérer la mise à jour des relations SeoPostTag avec listTags
            // Supprimer toutes les relations de tags existantes
            await prisma.seoPostTag.deleteMany({
                where: { postId: id }
            })

            // Créer les nouvelles relations de tags avec listTags (pas metaKeywords)
            if (data.listTags && data.listTags.length > 0) {
                await Promise.all(data.listTags.map(async (tagName) => {
                    // Générer un slug unique pour le tag
                    const baseSlug = tagName.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-')

                    // Créer ou récupérer le tag en utilisant le slug comme clé unique
                    const tag = await prisma.seoTag.upsert({
                        where: { slug: baseSlug },
                        update: {
                            name: tagName // Mettre à jour le nom si le slug existe déjà
                        },
                        create: {
                            name: tagName,
                            slug: baseSlug
                        }
                    })

                    // Créer la relation seulement si elle n'existe pas déjà
                    const existingRelation = await prisma.seoPostTag.findFirst({
                        where: {
                            postId: id,
                            tagId: tag.id
                        }
                    })

                    if (!existingRelation) {
                        await prisma.seoPostTag.create({
                            data: {
                                postId: id,
                                tagId: tag.id
                            }
                        })
                    }
                }))
            }
        }

        // TRADUCTION AUTOMATIQUE : Gérer les traductions dans les autres langues
        // Seulement si le post est le post pivot (originalPostId === null) et qu'il y a des modifications de contenu
        const isContentUpdate = data.title || data.metaDescription || data.content || data.excerpt || data.listTags || data.mainImageAlt || data.mainImageCaption
        const isStatusUpdate = data.status !== undefined
        const isPinnedUpdate = data.pinned !== undefined
        const isOriginalPost = existingPost.originalPostId === null

        console.log('🔍 Vérification pour traduction automatique:')
        console.log(`   - Post ID: ${id}`)
        console.log(`   - Est un post original (pivot): ${isOriginalPost}`)
        console.log(`   - originalPostId: ${existingPost.originalPostId}`)
        console.log(`   - Modifications de contenu: ${isContentUpdate}`)
        console.log(`   - Modification de statut: ${isStatusUpdate}`)
        console.log(`   - Modification d'épinglage: ${isPinnedUpdate}`)

        // Synchroniser le statut et l'épinglage avec toutes les traductions si c'est un post pivot
        if (isOriginalPost && (isStatusUpdate || isPinnedUpdate)) {
            console.log('🔄 Synchronisation du statut/épinglage avec les traductions...')

            const updateDataForTranslations: any = {}
            if (isStatusUpdate) updateDataForTranslations.status = data.status
            if (isPinnedUpdate) updateDataForTranslations.pinned = data.pinned

            await prisma.seoPost.updateMany({
                where: { originalPostId: id },
                data: updateDataForTranslations
            })

            console.log(`✅ Statut/épinglage synchronisé avec les traductions`)
        }

        if (isContentUpdate && isOriginalPost) {
            console.log('✅ Conditions remplies pour la traduction automatique')

            // Préparer les champs à traduire avec les données mises à jour
            const fieldsToTranslate = {
                title: data.title || existingPost.title,
                metaDescription: data.metaDescription || existingPost.metaDescription,
                metaKeywords: data.metaKeywords || existingPost.metaKeywords || [],
                content: data.content || existingPost.content,
                excerpt: data.excerpt || existingPost.excerpt || '',
                listTags: data.listTags || existingPost.listTags || [],
                mainImageAlt: data.mainImageAlt || existingPost.mainImageAlt || '',
                mainImageCaption: data.mainImageCaption || existingPost.mainImageCaption || '',
                // IMPORTANT: Inclure les champs HTML
                generatedHtml: generatedHtmlWithReadTime || existingPost.generatedHtml || '',
                jsonLd: jsonLd || existingPost.jsonLd || '',
                generatedArticleHtml: generatedArticleHtmlWithReadTime || existingPost.generatedArticleHtml || '',
                // Champs à synchroniser
                status: data.status || existingPost.status,
                pinned: data.pinned || existingPost.pinned || false
            }

            console.log('🔄 Lancement de la traduction automatique avec champs HTML')
            console.log(`   - generatedHtml: ${fieldsToTranslate.generatedHtml ? 'Présent' : 'Absent'}`)
            console.log(`   - jsonLd: ${fieldsToTranslate.jsonLd ? 'Présent' : 'Absent'}`)
            console.log(`   - generatedArticleHtml: ${fieldsToTranslate.generatedArticleHtml ? 'Présent' : 'Absent'}`)

            // Lancer la traduction automatique de manière asynchrone pour ne pas bloquer la réponse
            handleSeoPostTranslationsOnUpdate(id, fieldsToTranslate)
                .then(result => {
                    if (result.success) {
                        console.log(`✅ Traductions automatiques: ${result.message}`)
                    } else {
                        console.error('❌ Erreur lors des traductions automatiques:', result.message)
                    }
                })
                .catch(error => {
                    console.error('❌ Erreur lors des traductions automatiques:', error)
                })
        } else {
            if (!isOriginalPost) {
                console.log('⏭️  Traduction automatique ignorée: ce post est une traduction (originalPostId !== null)')
            }
            if (!isContentUpdate) {
                console.log('⏭️  Traduction automatique ignorée: aucune modification de contenu détectée')
            }
        }

        revalidatePath('/landing/seo-posts')
        revalidatePath(`/landing/seo-posts/${id}/edit`)

        return {
            success: true,
            seoPost
        }
    } catch (error) {
        console.error(`Erreur lors de la mise à jour de l'article SEO ${id}:`, error || 'Erreur inconnue')
        return {
            success: false,
            message: error instanceof Error ? error.message : 'Une erreur inconnue est survenue'
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

        // Déterminer l'ID du post pivot et récupérer tous les posts associés
        let pivotPostId: number
        let relatedPostIds: number[] = []

        if (existingPost.originalPostId === null) {
            // Le post courant est le pivot
            pivotPostId = id

            // Récupérer toutes les traductions de ce post pivot
            const translations = await prisma.seoPost.findMany({
                where: { originalPostId: id },
                select: { id: true }
            })

            relatedPostIds = [id, ...translations.map(t => t.id)]
        } else {
            // Le post courant est une traduction
            pivotPostId = existingPost.originalPostId

            // Récupérer le post pivot et toutes ses traductions (y compris le post courant)
            const [pivotPost, translations] = await Promise.all([
                prisma.seoPost.findUnique({
                    where: { id: pivotPostId },
                    select: { id: true }
                }),
                prisma.seoPost.findMany({
                    where: { originalPostId: pivotPostId },
                    select: { id: true }
                })
            ])

            if (!pivotPost) {
                return {
                    success: false,
                    message: 'Post pivot non trouvé'
                }
            }

            relatedPostIds = [pivotPostId, ...translations.map(t => t.id)]
        }

        // Dépingler tous les autres articles (qui ne sont pas dans le groupe à épingler)
        await prisma.seoPost.updateMany({
            where: {
                id: { notIn: relatedPostIds },
                pinned: true
            },
            data: {
                pinned: false
            }
        })

        // Épingler tous les articles du groupe (pivot + traductions)
        await prisma.seoPost.updateMany({
            where: {
                id: { in: relatedPostIds }
            },
            data: {
                pinned: true
            }
        })

        // Récupérer l'article mis à jour pour la réponse
        const updatedPost = await prisma.seoPost.findUnique({
            where: { id }
        })

        revalidatePath('/landing/seo-posts')
        revalidatePath(`/landing/seo-posts/${id}/edit`)

        return {
            success: true,
            seoPost: updatedPost,
            message: `Article épinglé avec ${relatedPostIds.length - 1} traduction(s) associée(s)`
        }
    } catch (error) {
        console.error(`Erreur lors de l'épinglage de l'article SEO ${id}:`, error)
        return {
            success: false,
            message: (error as Error).message
        }
    }
}

// Nouvelle fonction pour créer une traduction
export async function createSeoPostTranslation(
    originalPostId: number,
    targetLanguageCode: string
) {
    try {
        // Récupérer la langue cible
        const targetLanguage = await getLanguageByCode(targetLanguageCode)
        if (!targetLanguage) {
            return {
                success: false,
                message: 'Langue cible non trouvée'
            }
        }

        // Récupérer le post original avec sa langue
        const originalPost = await prisma.seoPost.findUnique({
            where: { id: originalPostId },
            include: { language: true }
        })

        if (!originalPost) {
            return {
                success: false,
                message: 'Article original non trouvé'
            }
        }

        // Vérifier si une traduction existe déjà
        const existingTranslation = await prisma.seoPost.findFirst({
            where: {
                originalPostId: originalPostId,
                languageId: targetLanguage.id
            }
        })

        if (existingTranslation) {
            return {
                success: false,
                message: `Une traduction en ${targetLanguage.name} existe déjà`
            }
        }

        // Préparer les champs à traduire
        const fieldsToTranslate = {
            title: originalPost.title,
            metaDescription: originalPost.metaDescription,
            metaKeywords: originalPost.metaKeywords || [],
            content: originalPost.content,
            excerpt: originalPost.excerpt || '',
            listTags: originalPost.listTags || [],
            mainImageAlt: originalPost.mainImageAlt || '',
            mainImageCaption: originalPost.mainImageCaption || '',
            // IMPORTANT: Inclure les champs HTML
            generatedHtml: originalPost.generatedHtml || '',
            jsonLd: originalPost.jsonLd || '',
            generatedArticleHtml: originalPost.generatedArticleHtml || '',
            // Champs à synchroniser
            status: originalPost.status,
            pinned: originalPost.pinned || false
        }

        // Traduire
        const translatedFields = await translateSeoPostFields(fieldsToTranslate, targetLanguageCode)

        // Créer le post traduit
        const translatedPost = await createSeoPost({
            title: translatedFields.title,
            categoryId: originalPost.categoryId,
            metaDescription: translatedFields.metaDescription,
            metaKeywords: translatedFields.metaKeywords,
            slug: translatedFields.slug,
            content: translatedFields.content,
            excerpt: translatedFields.excerpt,
            author: originalPost.author,
            authorLink: originalPost.authorLink ?? undefined,
            estimatedReadTime: originalPost.estimatedReadTime,
            status: translatedFields.status || 'DRAFT',
            pinned: translatedFields.pinned || false,
            mainImageUrl: originalPost.mainImageUrl ?? undefined,
            mainImageAlt: translatedFields.mainImageAlt,
            mainImageCaption: translatedFields.mainImageCaption,
            creationDate: originalPost.createdAt,
            listTags: translatedFields.listTags,
            // Nouveaux champs
            languageId: targetLanguage.id,
            originalPostId: originalPostId
        })

        return translatedPost
    } catch (error) {
        console.error('Erreur lors de la création de la traduction:', error)
        return {
            success: false,
            message: (error as Error).message
        }
    }
}

// Nouvelle fonction pour récupérer les posts par langue
export async function getSeoPostsByLanguage(languageCode: string = 'fr') {
    try {
        const posts = await prisma.seoPost.findMany({
            where: {
                language: {
                    code: languageCode
                }
            },
            include: {
                language: true,
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

        return posts
    } catch (error) {
        console.error('Erreur lors de la récupération des articles:', error)
        throw new Error('Impossible de récupérer les articles')
    }
} 