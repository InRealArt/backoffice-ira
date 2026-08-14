'use server'

import { prisma } from '@/lib/prisma'
import { translateHtmlContent, translateJsonLd, translateArticleHtml } from './html-translation-service'

export interface FieldsToTranslate {
    title: string
    metaDescription: string
    metaKeywords: string[]
    content: string // JSON du BlogContent
    excerpt?: string
    listTags: string[]
    mainImageAlt?: string
    mainImageCaption?: string
    // Nouveaux champs HTML
    generatedHtml?: string
    jsonLd?: string
    generatedArticleHtml?: string
    // Nouveaux champs à synchroniser
    status?: 'DRAFT' | 'PUBLISHED'
    pinned?: boolean
}

export interface TranslatedFields {
    title: string
    metaDescription: string
    metaKeywords: string[]
    content: string
    excerpt?: string
    listTags: string[]
    mainImageAlt?: string
    mainImageCaption?: string
    slug: string
    // Nouveaux champs HTML traduits
    generatedHtml?: string
    jsonLd?: string
    generatedArticleHtml?: string
    // Nouveaux champs à synchroniser
    status?: 'DRAFT' | 'PUBLISHED'
    pinned?: boolean
}

// Fonction de traduction avec Google Translate
async function translateWithGoogle(
    text: string,
    targetLang: string,
    sourceLang: string = 'fr'
): Promise<string> {
    if (!text || text.trim() === '') return text

    try {
        // Utilise l'API Google Translate gratuite
        const response = await fetch(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
        )
        const data = await response.json()
        // data[0] contient un segment par phrase/portion découpée par Google pour les
        // textes longs : il faut tous les concaténer, sinon seule la première portion
        // traduite est conservée et le reste du texte disparaît silencieusement.
        const translated = Array.isArray(data?.[0])
            ? data[0].map((segment: any) => segment[0]).join('')
            : ''
        return translated || text
    } catch (error) {
        console.error('Erreur Google Translate:', error)
        return text
    }
}

// Fonction de traduction de fallback simple
async function simpleTranslation(
    fields: FieldsToTranslate,
    targetLanguageCode: string
): Promise<TranslatedFields> {
    const targetLanguage = await prisma.language.findUnique({
        where: { code: targetLanguageCode }
    })

    if (!targetLanguage) {
        throw new Error(`Langue non trouvée: ${targetLanguageCode}`)
    }

    // Traduction basique avec préfixe indiquant la langue
    const languagePrefix = `[${targetLanguageCode.toUpperCase()}]`

    // Traduction simple du contenu JSON
    let translatedContent = fields.content
    try {
        const contentData = JSON.parse(fields.content)
        if (Array.isArray(contentData)) {
            const translatedSections = contentData.map((section: any) => {
                const translatedSection = { ...section }

                // Traduire le titre de la section
                if (section.title) {
                    translatedSection.title = `${languagePrefix} ${section.title}`
                }

                // Traduire les éléments
                if (section.elements && Array.isArray(section.elements)) {
                    translatedSection.elements = section.elements.map((element: any) => {
                        const translatedElement = { ...element }

                        // Traduire le contenu textuel (h2, h3, paragraph)
                        if (['h2', 'h3', 'paragraph'].includes(element.type)) {
                            if (element.content) {
                                translatedElement.content = `${languagePrefix} ${element.content}`
                            }
                        }

                        // Traduire les attributs des images
                        if (element.type === 'image') {
                            if (element.alt) {
                                translatedElement.alt = `${languagePrefix} ${element.alt}`
                            }
                            if (element.caption) {
                                translatedElement.caption = `${languagePrefix} ${element.caption}`
                            }
                        }

                        // Traduire les attributs des vidéos
                        if (element.type === 'video') {
                            if (element.caption) {
                                translatedElement.caption = `${languagePrefix} ${element.caption}`
                            }
                            // L'URL reste inchangée
                        }

                        // Traduire les accordéons
                        if (element.type === 'accordion') {
                            // Traduire le titre de l'accordéon
                            if (element.title) {
                                translatedElement.title = `${languagePrefix} ${element.title}`
                            }

                            // Traduire chaque item de l'accordéon
                            if (element.items && Array.isArray(element.items)) {
                                translatedElement.items = element.items.map((item: any) => ({
                                    ...item,
                                    title: item.title ? `${languagePrefix} ${item.title}` : item.title,
                                    content: item.content ? `${languagePrefix} ${item.content}` : item.content
                                }))
                            }
                        }

                        return translatedElement
                    })
                }

                return translatedSection
            })
            translatedContent = JSON.stringify(translatedSections, null, 2)
        }
    } catch (error) {
        console.error('Erreur lors de la traduction simple du JSON:', error)
        // Garder le contenu original en cas d'erreur
    }

    return {
        title: `${languagePrefix} ${fields.title}`,
        metaDescription: `${languagePrefix} ${fields.metaDescription}`,
        metaKeywords: fields.metaKeywords.map(keyword => `${languagePrefix} ${keyword}`),
        content: translatedContent,
        excerpt: fields.excerpt ? `${languagePrefix} ${fields.excerpt}` : undefined,
        listTags: fields.listTags.map(tag => `${languagePrefix} ${tag}`),
        mainImageAlt: fields.mainImageAlt ? `${languagePrefix} ${fields.mainImageAlt}` : undefined,
        mainImageCaption: fields.mainImageCaption ? `${languagePrefix} ${fields.mainImageCaption}` : undefined,
        slug: `${targetLanguageCode}-${fields.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`,
        // Pour les champs HTML, on les garde tels quels en fallback
        generatedHtml: fields.generatedHtml,
        jsonLd: fields.jsonLd,
        generatedArticleHtml: fields.generatedArticleHtml,
        // Champs à synchroniser (non traduits)
        status: fields.status,
        pinned: fields.pinned
    }
}

// Fonction pour traduire le contenu JSON structuré
async function translateJsonContent(
    jsonContent: string,
    targetLang: string,
    sourceLang: string = 'fr'
): Promise<string> {
    if (!jsonContent || jsonContent.trim() === '') return jsonContent

    try {
        const contentData = JSON.parse(jsonContent)

        // Si ce n'est pas un tableau, retourner tel quel
        if (!Array.isArray(contentData)) {
            return jsonContent
        }

        // Traduire chaque section
        const translatedSections = await Promise.all(
            contentData.map(async (section: any) => {
                if (!section.elements || !Array.isArray(section.elements)) {
                    return section
                }

                // Traduire le titre de la section si présent
                const translatedTitle = section.title
                    ? await translateWithGoogle(section.title, targetLang, sourceLang)
                    : section.title

                // Traduire chaque élément de la section
                const translatedElements = await Promise.all(
                    section.elements.map(async (element: any) => {
                        const translatedElement = { ...element }

                        // Traduire le contenu textuel selon le type
                        if (['h2', 'h3', 'paragraph'].includes(element.type)) {
                            if (element.content) {
                                translatedElement.content = await translateWithGoogle(element.content, targetLang, sourceLang)
                            }

                            // Le rendu privilégie richContent.segments quand il est présent :
                            // il faut donc aussi traduire le texte de chaque segment, sous peine
                            // que le contenu affiché reste dans la langue d'origine.
                            if (element.richContent?.segments && Array.isArray(element.richContent.segments)) {
                                translatedElement.richContent = {
                                    ...element.richContent,
                                    segments: await Promise.all(
                                        element.richContent.segments.map(async (segment: any) => ({
                                            ...segment,
                                            text: segment.text ? await translateWithGoogle(segment.text, targetLang, sourceLang) : segment.text,
                                            linkText: segment.linkText ? await translateWithGoogle(segment.linkText, targetLang, sourceLang) : segment.linkText
                                        }))
                                    )
                                }
                            }
                        }

                        // Traduire les attributs des images
                        if (element.type === 'image') {
                            if (element.alt) {
                                translatedElement.alt = await translateWithGoogle(element.alt, targetLang, sourceLang)
                            }
                            if (element.caption) {
                                translatedElement.caption = await translateWithGoogle(element.caption, targetLang, sourceLang)
                            }
                        }

                        // Traduire les attributs des vidéos
                        if (element.type === 'video') {
                            if (element.caption) {
                                translatedElement.caption = await translateWithGoogle(element.caption, targetLang, sourceLang)
                            }
                            // L'URL reste inchangée
                        }

                        // Traduire les listes (à puces et numérotées)
                        if ((element.type === 'list' || element.type === 'ordered_list') && Array.isArray(element.items)) {
                            translatedElement.items = await Promise.all(
                                element.items.map((item: string) => translateWithGoogle(item, targetLang, sourceLang))
                            )
                        }

                        // Traduire les accordéons
                        if (element.type === 'accordion') {
                            // Traduire le titre de l'accordéon
                            if (element.title) {
                                translatedElement.title = await translateWithGoogle(element.title, targetLang, sourceLang)
                            }

                            // Traduire chaque item de l'accordéon
                            if (element.items && Array.isArray(element.items)) {
                                translatedElement.items = await Promise.all(
                                    element.items.map(async (item: any) => ({
                                        ...item,
                                        title: item.title ? await translateWithGoogle(item.title, targetLang, sourceLang) : item.title,
                                        content: item.content ? await translateWithGoogle(item.content, targetLang, sourceLang) : item.content
                                    }))
                                )
                            }
                        }

                        return translatedElement
                    })
                )

                return {
                    ...section,
                    title: translatedTitle,
                    elements: translatedElements
                }
            })
        )

        return JSON.stringify(translatedSections, null, 2)
    } catch (error) {
        console.error('❌ Erreur lors de la traduction du contenu JSON:', error)
        return jsonContent // Retourner le contenu original en cas d'erreur
    }
}

export async function translateSeoPostFields(
    fields: FieldsToTranslate,
    targetLanguageCode: string
): Promise<TranslatedFields> {
    // Récupérer le nom de la langue depuis la DB
    const targetLanguage = await prisma.language.findUnique({
        where: { code: targetLanguageCode }
    })

    if (!targetLanguage) {
        throw new Error(`Langue non trouvée: ${targetLanguageCode}`)
    }

    // Mapping des codes de langue pour Google Translate
    const langMap: Record<string, string> = {
        'en': 'en',
        'es': 'es',
        'de': 'de',
        'it': 'it',
        'pt': 'pt',
        'nl': 'nl',
        'ru': 'ru',
        'ja': 'ja',
        'ko': 'ko',
        'zh': 'zh'
    }

    const mappedLang = langMap[targetLanguageCode] || targetLanguageCode

    try {
        console.log(`🌍 Traduction vers ${targetLanguage.name} avec Google Translate`)

        // Traduire les champs textuels de base
        const [
            translatedTitle,
            translatedMetaDescription,
            translatedExcerpt,
            translatedMainImageAlt,
            translatedMainImageCaption
        ] = await Promise.all([
            translateWithGoogle(fields.title, mappedLang),
            translateWithGoogle(fields.metaDescription, mappedLang),
            fields.excerpt ? translateWithGoogle(fields.excerpt, mappedLang) : undefined,
            fields.mainImageAlt ? translateWithGoogle(fields.mainImageAlt, mappedLang) : undefined,
            fields.mainImageCaption ? translateWithGoogle(fields.mainImageCaption, mappedLang) : undefined
        ])

        // Traduire les mots-clés et tags
        const [translatedKeywords, translatedTags] = await Promise.all([
            Promise.all(fields.metaKeywords.map(keyword => translateWithGoogle(keyword, mappedLang))),
            Promise.all(fields.listTags.map(tag => translateWithGoogle(tag, mappedLang)))
        ])

        // Traduire le contenu JSON structuré
        console.log('📝 Traduction du contenu JSON...')
        const translatedContent = await translateJsonContent(fields.content, mappedLang)

        // Traduire les champs HTML si présents
        let translatedGeneratedHtml: string | undefined
        let translatedJsonLd: string | undefined
        let translatedGeneratedArticleHtml: string | undefined

        if (fields.generatedHtml || fields.jsonLd || fields.generatedArticleHtml) {
            console.log('🔧 Traduction des champs HTML...')

            const htmlTranslations = await Promise.all([
                fields.generatedHtml ? translateHtmlContent(fields.generatedHtml, mappedLang) : undefined,
                fields.jsonLd ? translateJsonLd(fields.jsonLd, mappedLang) : undefined,
                fields.generatedArticleHtml ? translateArticleHtml(fields.generatedArticleHtml, mappedLang) : undefined
            ])

            translatedGeneratedHtml = htmlTranslations[0]
            translatedJsonLd = htmlTranslations[1]
            translatedGeneratedArticleHtml = htmlTranslations[2]
        }

        // Générer un slug SEO-friendly
        const slug = `${targetLanguageCode}-${translatedTitle.toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '')}`

        return {
            title: translatedTitle,
            metaDescription: translatedMetaDescription,
            metaKeywords: translatedKeywords,
            content: translatedContent, // Contenu JSON traduit
            excerpt: translatedExcerpt,
            listTags: translatedTags,
            mainImageAlt: translatedMainImageAlt,
            mainImageCaption: translatedMainImageCaption,
            slug,
            // Champs HTML traduits
            generatedHtml: translatedGeneratedHtml,
            jsonLd: translatedJsonLd,
            generatedArticleHtml: translatedGeneratedArticleHtml,
            // Champs à synchroniser (non traduits)
            status: fields.status,
            pinned: fields.pinned
        }
    } catch (error: any) {
        console.error('❌ Erreur lors de la traduction Google:', error)
        console.warn('🔄 Basculement vers la traduction simple')
        return simpleTranslation(fields, targetLanguageCode)
    }
}

/**
 * Traduit automatiquement les champs d'un SeoPost vers l'anglais.
 * Utilise la détection automatique de langue (sl=auto) de Google Translate :
 * un texte déjà en anglais est retourné inchangé, un texte en français (ou toute
 * autre langue) est traduit vers l'anglais. Utilisé lors de l'édition d'un post
 * dont la langue (languageId) est l'anglais, pour corriger tout contenu saisi
 * par erreur en français.
 */
export async function translateFieldsToEnglish(
    fields: FieldsToTranslate
): Promise<{ fields: TranslatedFields; translationFailed: boolean }> {
    const sourceLang = 'auto'
    const targetLang = 'en'

    try {
        const [
            translatedTitle,
            translatedMetaDescription,
            translatedExcerpt,
            translatedMainImageAlt,
            translatedMainImageCaption
        ] = await Promise.all([
            translateWithGoogle(fields.title, targetLang, sourceLang),
            translateWithGoogle(fields.metaDescription, targetLang, sourceLang),
            fields.excerpt ? translateWithGoogle(fields.excerpt, targetLang, sourceLang) : undefined,
            fields.mainImageAlt ? translateWithGoogle(fields.mainImageAlt, targetLang, sourceLang) : undefined,
            fields.mainImageCaption ? translateWithGoogle(fields.mainImageCaption, targetLang, sourceLang) : undefined
        ])

        const [translatedKeywords, translatedTags] = await Promise.all([
            Promise.all(fields.metaKeywords.map(keyword => translateWithGoogle(keyword, targetLang, sourceLang))),
            Promise.all(fields.listTags.map(tag => translateWithGoogle(tag, targetLang, sourceLang)))
        ])

        const translatedContent = await translateJsonContent(fields.content, targetLang, sourceLang)

        let translatedGeneratedHtml: string | undefined
        let translatedJsonLd: string | undefined
        let translatedGeneratedArticleHtml: string | undefined

        if (fields.generatedHtml || fields.jsonLd || fields.generatedArticleHtml) {
            const htmlTranslations = await Promise.all([
                fields.generatedHtml ? translateHtmlContent(fields.generatedHtml, targetLang, sourceLang) : undefined,
                fields.jsonLd ? translateJsonLd(fields.jsonLd, targetLang, sourceLang) : undefined,
                fields.generatedArticleHtml ? translateArticleHtml(fields.generatedArticleHtml, targetLang, sourceLang) : undefined
            ])

            translatedGeneratedHtml = htmlTranslations[0]
            translatedJsonLd = htmlTranslations[1]
            translatedGeneratedArticleHtml = htmlTranslations[2]
        }

        return {
            translationFailed: false,
            fields: {
                title: translatedTitle,
                metaDescription: translatedMetaDescription,
                metaKeywords: translatedKeywords,
                content: translatedContent,
                excerpt: translatedExcerpt,
                listTags: translatedTags,
                mainImageAlt: translatedMainImageAlt,
                mainImageCaption: translatedMainImageCaption,
                slug: translatedTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
                generatedHtml: translatedGeneratedHtml,
                jsonLd: translatedJsonLd,
                generatedArticleHtml: translatedGeneratedArticleHtml,
                status: fields.status,
                pinned: fields.pinned
            }
        }
    } catch (error) {
        console.error('❌ Erreur lors de la traduction automatique vers l\'anglais:', error)
        return {
            translationFailed: true,
            fields: {
                title: fields.title,
                metaDescription: fields.metaDescription,
                metaKeywords: fields.metaKeywords,
                content: fields.content,
                excerpt: fields.excerpt,
                listTags: fields.listTags,
                mainImageAlt: fields.mainImageAlt,
                mainImageCaption: fields.mainImageCaption,
                slug: fields.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
                generatedHtml: fields.generatedHtml,
                jsonLd: fields.jsonLd,
                generatedArticleHtml: fields.generatedArticleHtml,
                status: fields.status,
                pinned: fields.pinned
            }
        }
    }
}

// Nouvelles fonctions utilitaires
export async function getLanguageByCode(code: string) {
    return await prisma.language.findUnique({
        where: { code }
    })
}

export async function getAllLanguages() {
    return await prisma.language.findMany({
        orderBy: { isDefault: 'desc' }
    })
}

export async function checkTranslationExists(
    postId: number,
    languageCode: string
): Promise<boolean> {
    const language = await getLanguageByCode(languageCode)
    if (!language) return false

    const existing = await prisma.seoPost.findFirst({
        where: {
            originalPostId: postId,
            languageId: language.id
        }
    })

    return !!existing
}

/**
 * Gère automatiquement les traductions lors de l'édition d'un SeoPost
 * - Si des traductions n'existent pas, les crée dans toutes les langues non-par-défaut
 * - Si des traductions existent, les met à jour
 */
export async function handleSeoPostTranslationsOnUpdate(
    postId: number,
    updatedFields: FieldsToTranslate
): Promise<{ success: boolean; message?: string; translationsCreated: number; translationsUpdated: number }> {
    try {
        // Récupérer le post original avec TOUS les champs nécessaires
        const originalPost = await prisma.seoPost.findUnique({
            where: { id: postId },
            include: { language: true }
        })

        if (!originalPost) {
            return { success: false, message: 'Post introuvable', translationsCreated: 0, translationsUpdated: 0 }
        }

        // Récupérer toutes les langues sauf la langue par défaut (français)
        const nonDefaultLanguages = await prisma.language.findMany({
            where: { isDefault: false }
        })

        if (nonDefaultLanguages.length === 0) {
            return { success: true, message: 'Aucune langue cible trouvée', translationsCreated: 0, translationsUpdated: 0 }
        }

        // Préparer les champs complets à traduire en combinant les données mises à jour avec les données existantes
        const completeFieldsToTranslate: FieldsToTranslate = {
            title: updatedFields.title || originalPost.title,
            metaDescription: updatedFields.metaDescription || originalPost.metaDescription,
            metaKeywords: updatedFields.metaKeywords || originalPost.metaKeywords || [],
            content: updatedFields.content || originalPost.content,
            excerpt: updatedFields.excerpt || originalPost.excerpt || '',
            listTags: updatedFields.listTags || originalPost.listTags || [],
            mainImageAlt: updatedFields.mainImageAlt || originalPost.mainImageAlt || '',
            mainImageCaption: updatedFields.mainImageCaption || originalPost.mainImageCaption || '',
            // IMPORTANT: Inclure les champs HTML depuis la base de données
            generatedHtml: updatedFields.generatedHtml || originalPost.generatedHtml || '',
            jsonLd: updatedFields.jsonLd || originalPost.jsonLd || '',
            generatedArticleHtml: updatedFields.generatedArticleHtml || originalPost.generatedArticleHtml || '',
            // Nouveaux champs à synchroniser
            status: updatedFields.status || originalPost.status,
            pinned: updatedFields.pinned === undefined ? originalPost.pinned : updatedFields.pinned
        }

        console.log('🔄 Champs HTML à traduire:')
        console.log(`   - generatedHtml: ${completeFieldsToTranslate.generatedHtml ? 'Présent' : 'Absent'}`)
        console.log(`   - jsonLd: ${completeFieldsToTranslate.jsonLd ? 'Présent' : 'Absent'}`)
        console.log(`   - generatedArticleHtml: ${completeFieldsToTranslate.generatedArticleHtml ? 'Présent' : 'Absent'}`)

        let translationsCreated = 0
        let translationsUpdated = 0

        // Pour chaque langue non-par-défaut
        for (const targetLanguage of nonDefaultLanguages) {
            // Vérifier si une traduction existe déjà
            const existingTranslation = await prisma.seoPost.findFirst({
                where: {
                    originalPostId: postId,
                    languageId: targetLanguage.id
                }
            })

            try {
                // Traduire les champs complets
                const translatedFields = await translateSeoPostFields(completeFieldsToTranslate, targetLanguage.code)

                const updateData = {
                    title: translatedFields.title,
                    metaDescription: translatedFields.metaDescription,
                    metaKeywords: translatedFields.metaKeywords,
                    content: translatedFields.content,
                    excerpt: translatedFields.excerpt,
                    listTags: translatedFields.listTags,
                    mainImageAlt: translatedFields.mainImageAlt,
                    mainImageCaption: translatedFields.mainImageCaption,
                    slug: translatedFields.slug,
                    // Champs HTML traduits
                    generatedHtml: translatedFields.generatedHtml,
                    jsonLd: translatedFields.jsonLd,
                    generatedArticleHtml: translatedFields.generatedArticleHtml,
                    // Conserver les autres champs du post original
                    author: originalPost.author,
                    authorLink: originalPost.authorLink,
                    estimatedReadTime: originalPost.estimatedReadTime,
                    status: translatedFields.status,
                    pinned: translatedFields.pinned,
                    mainImageUrl: originalPost.mainImageUrl,
                    categoryId: originalPost.categoryId,
                    viewsCount: 0,
                    createdAt: originalPost.createdAt
                }

                if (existingTranslation) {
                    // Mettre à jour la traduction existante
                    await prisma.seoPost.update({
                        where: { id: existingTranslation.id },
                        data: updateData
                    })
                    translationsUpdated++
                    console.log(`✅ Traduction mise à jour pour ${targetLanguage.name}`)
                } else {
                    // Créer une nouvelle traduction
                    await prisma.seoPost.create({
                        data: {
                            languageId: targetLanguage.id,
                            originalPostId: postId,
                            ...updateData
                        }
                    })
                    translationsCreated++
                    console.log(`✅ Nouvelle traduction créée pour ${targetLanguage.name}`)
                }
            } catch (translationError) {
                console.error(`❌ Erreur lors de la traduction vers ${targetLanguage.code}:`, translationError)
                // Continuer avec les autres langues même si une traduction échoue
            }
        }

        const message = `${translationsCreated} traductions créées, ${translationsUpdated} mises à jour`
        return {
            success: true,
            message,
            translationsCreated,
            translationsUpdated
        }

    } catch (error) {
        console.error('Erreur lors de la gestion des traductions:', error)
        return {
            success: false,
            message: (error as Error).message,
            translationsCreated: 0,
            translationsUpdated: 0
        }
    }
} 