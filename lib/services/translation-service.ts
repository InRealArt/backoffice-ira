'use server'

import { prisma } from '@/lib/prisma'
import { generateSeoJsonLd, generateSeoHtml, generateArticleHtml, SeoPostData } from '@/lib/utils/seo-generators'
import { calculateReadingTime } from '@/lib/utils/reading-time-calculator'
import { BlogContent, ElementType } from '@/app/components/BlogEditor/types'

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

// L'API Google Translate gratuite (non officielle) bloque l'IP appelante (HTTP 429)
// quand elle reçoit trop de requêtes. Plutôt qu'un appel par texte (des dizaines par
// article, en parallèle), les textes sont regroupés en quelques paquets envoyés l'un
// après l'autre. Si Google bloque malgré tout, MyMemory (gratuit, sans compte) prend le relais.
const GOOGLE_TRANSLATE_URL = 'https://translate.googleapis.com/translate_a/single'
// Taille max d'un paquet (en caractères) : limite de Google Traduction ~5000
const MAX_BATCH_CHARS = 4500
// Séparateur entre les textes d'un paquet : Google conserve les sauts de ligne
const BATCH_SEPARATOR = '\n'
const MYMEMORY_URL = 'https://api.mymemory.translated.net/get'

// Google a bloqué l'IP : inutile de réessayer, il faut basculer sur MyMemory
class GoogleRateLimitError extends Error {}

// Envoie une requête de traduction ; lève une erreur si Google ne répond pas
async function requestGoogleTranslation(
    text: string,
    targetLang: string,
    sourceLang: string
): Promise<string> {
    const maxAttempts = 3
    for (let attempt = 1; ; attempt++) {
        try {
            // POST : pas de limite de longueur d'URL pour les paquets volumineux
            const response = await fetch(
                `${GOOGLE_TRANSLATE_URL}?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
                    body: new URLSearchParams({ q: text })
                }
            )
            if (response.status === 429) {
                throw new GoogleRateLimitError('Google Translate HTTP 429')
            }
            if (!response.ok) {
                throw new Error(`Google Translate HTTP ${response.status}`)
            }
            const data = await response.json()
            // data[0] contient un segment par phrase/portion découpée par Google :
            // il faut tous les concaténer pour récupérer le texte complet.
            if (!Array.isArray(data?.[0])) {
                throw new Error('Réponse Google Translate inattendue')
            }
            return data[0].map((segment: any) => segment[0] ?? '').join('')
        } catch (error) {
            if (error instanceof GoogleRateLimitError || attempt >= maxAttempts) throw error
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        }
    }
}

// Test préalable : une requête minuscule pour savoir si Google bloque l'IP
async function isGoogleRateLimited(targetLang: string, sourceLang: string): Promise<boolean> {
    try {
        await requestGoogleTranslation('bonjour', targetLang, sourceLang)
        return false
    } catch (error) {
        // Les autres erreurs (réseau…) seront retentées lors de la traduction
        return error instanceof GoogleRateLimitError
    }
}

// Traduit des textes non vides avec Google, regroupés en quelques requêtes
async function translateTextsWithGoogle(
    texts: string[],
    targetLang: string,
    sourceLang: string
): Promise<string[]> {
    const results = [...texts]

    // Constituer les paquets d'indices de textes à traduire
    const batches: number[][] = []
    let current: number[] = []
    let currentSize = 0
    texts.forEach((text, index) => {
        // Un texte multi-lignes casserait le découpage par séparateur : il part seul
        if (text.includes(BATCH_SEPARATOR) || text.length > MAX_BATCH_CHARS) {
            batches.push([index])
            return
        }
        if (current.length > 0 && currentSize + text.length + 1 > MAX_BATCH_CHARS) {
            batches.push(current)
            current = []
            currentSize = 0
        }
        current.push(index)
        currentSize += text.length + 1
    })
    if (current.length > 0) batches.push(current)

    // Paquets traduits l'un après l'autre pour ne pas déclencher le blocage de Google
    for (const batch of batches) {
        const joined = batch.map(index => texts[index]).join(BATCH_SEPARATOR)
        const translated = await requestGoogleTranslation(joined, targetLang, sourceLang)

        if (batch.length === 1) {
            results[batch[0]] = translated
            continue
        }

        const lines = translated.split(BATCH_SEPARATOR)
        if (lines.length === batch.length) {
            batch.forEach((index, i) => { results[index] = lines[i] })
        } else {
            // Google a fusionné ou découpé des lignes : on retraduit ce paquet texte par texte
            console.warn(`⚠️ Découpage du paquet incohérent (${lines.length}/${batch.length}), traduction texte par texte`)
            for (const index of batch) {
                results[index] = await requestGoogleTranslation(texts[index], targetLang, sourceLang)
            }
        }
    }

    return results
}

// MyMemory limite chaque requête à 500 octets (accents = 2 octets) : on garde une marge
const MYMEMORY_MAX_BYTES = 450

class MyMemoryQuotaError extends Error {}

const byteLength = (text: string) => new TextEncoder().encode(text).length

// Découpe un texte en morceaux de MYMEMORY_MAX_BYTES max : par phrase, puis par mot
function splitForMyMemory(text: string): string[] {
    const chunks: string[] = []
    let current = ''
    const pushPiece = (piece: string, separator: string) => {
        const candidate = current ? current + separator + piece : piece
        if (byteLength(candidate) <= MYMEMORY_MAX_BYTES) {
            current = candidate
            return
        }
        if (current) chunks.push(current)
        current = piece
    }

    for (const sentence of text.split(/(?<=[.!?…;:])\s+/)) {
        if (byteLength(sentence) <= MYMEMORY_MAX_BYTES) {
            pushPiece(sentence, ' ')
            continue
        }
        // Phrase trop longue : découpage par mots
        for (const word of sentence.split(/\s+/)) {
            pushPiece(word, ' ')
        }
    }
    if (current) chunks.push(current)
    return chunks
}

// MyMemory renvoie parfois des entités HTML dans les traductions issues de sa mémoire
function decodeHtmlEntities(text: string): string {
    return text
        .replace(/&#39;|&apos;/g, '\'')
        .replace(/&quot;/g, '"')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&')
}

async function requestMyMemoryTranslation(
    text: string,
    targetLang: string,
    sourceLang: string
): Promise<string> {
    const params = new URLSearchParams({
        q: text,
        langpair: `${sourceLang === 'auto' ? 'Autodetect' : sourceLang}|${targetLang}`
    })
    // Email facultatif : fait passer le quota de 5 000 à 50 000 caractères/jour
    if (process.env.MYMEMORY_EMAIL) params.set('de', process.env.MYMEMORY_EMAIL)

    const maxAttempts = 3
    for (let attempt = 1; ; attempt++) {
        try {
            const response = await fetch(`${MYMEMORY_URL}?${params}`)
            if (response.status === 429) {
                throw new MyMemoryQuotaError('Quota quotidien MyMemory atteint')
            }
            if (!response.ok) {
                throw new Error(`MyMemory HTTP ${response.status}`)
            }
            const data = await response.json()
            const translated: string | undefined = data?.responseData?.translatedText
            // Quota épuisé : MyMemory peut renvoyer un avertissement À LA PLACE de la traduction
            if (data?.quotaFinished || /^MYMEMORY WARNING/i.test(translated ?? '')) {
                throw new MyMemoryQuotaError('Quota quotidien MyMemory atteint')
            }
            // Détection automatique : un texte déjà dans la langue cible est refusé
            // par MyMemory (Google le renvoie tel quel) : on le conserve
            if (sourceLang === 'auto' && /DISTINCT LANGUAGES/i.test(translated ?? '')) {
                return text
            }
            if (Number(data?.responseStatus) !== 200 || !translated) {
                throw new Error(`MyMemory : ${data?.responseDetails || 'réponse inattendue'}`)
            }
            return decodeHtmlEntities(translated)
        } catch (error) {
            if (error instanceof MyMemoryQuotaError || attempt >= maxAttempts) throw error
            await new Promise(resolve => setTimeout(resolve, 1000 * attempt))
        }
    }
}

// Traduit des textes non vides avec MyMemory, une requête par morceau, l'une après l'autre
async function translateTextsWithMyMemory(
    texts: string[],
    targetLang: string,
    sourceLang: string
): Promise<string[]> {
    const results: string[] = []
    for (const text of texts) {
        // Ligne par ligne pour conserver les sauts de ligne
        const translatedLines: string[] = []
        for (const line of text.split('\n')) {
            if (!line.trim()) {
                translatedLines.push(line)
                continue
            }
            const translatedChunks: string[] = []
            for (const chunk of splitForMyMemory(line.trim())) {
                translatedChunks.push(await requestMyMemoryTranslation(chunk, targetLang, sourceLang))
            }
            translatedLines.push(translatedChunks.join(' '))
        }
        results.push(translatedLines.join('\n'))
    }
    return results
}

// Sépare les espaces de début/fin (perdus à la traduction) du texte à traduire
function splitOuterWhitespace(text: string) {
    const match = text.match(/^(\s*)([\s\S]*?)(\s*)$/)
    return { leading: match?.[1] ?? '', core: match?.[2] ?? text, trailing: match?.[3] ?? '' }
}

/**
 * Traduit une liste de textes avec Google, ou MyMemory si Google bloque (429).
 * Lève une erreur si la traduction échoue (au lieu de conserver silencieusement
 * le texte d'origine).
 */
async function translateBatch(
    texts: string[],
    targetLang: string,
    sourceLang: string
): Promise<string[]> {
    const results = [...texts]
    const parts = texts.map(splitOuterWhitespace)
    // Les textes sans aucune lettre (ponctuation, nombres) n'ont rien à traduire
    const indices = parts.flatMap(({ core }, index) => (/\p{L}/u.test(core) ? [index] : []))
    if (indices.length === 0) return results
    const cores = indices.map(index => parts[index].core)

    let translated: string[] | null = null
    if (await isGoogleRateLimited(targetLang, sourceLang)) {
        console.warn('⚠️ Google Translate bloque les requêtes (429) : bascule sur MyMemory')
    } else {
        try {
            translated = await translateTextsWithGoogle(cores, targetLang, sourceLang)
        } catch (error) {
            if (!(error instanceof GoogleRateLimitError)) throw error
            console.warn('⚠️ Google Translate a bloqué en cours de traduction (429) : bascule sur MyMemory')
        }
    }
    if (!translated) {
        translated = await translateTextsWithMyMemory(cores, targetLang, sourceLang)
    }

    indices.forEach((index, i) => {
        results[index] = parts[index].leading + translated[i].trim() + parts[index].trailing
    })
    return results
}


interface TextSlot {
    text: string
    apply: (translated: string) => void
}

// Ajoute une propriété texte d'un objet à la liste des textes à traduire
function addSlot(slots: TextSlot[], target: any, key: string | number) {
    const value = target?.[key]
    if (typeof value === 'string' && value.trim() !== '') {
        slots.push({ text: value, apply: translated => { target[key] = translated } })
    }
}

// Recense tous les textes du contenu structuré (BlogContent) à traduire
function collectContentSlots(contentData: any[], slots: TextSlot[]) {
    for (const section of contentData) {
        addSlot(slots, section, 'title')
        if (!Array.isArray(section.elements)) continue

        for (const element of section.elements) {
            if (['h2', 'h3', 'paragraph'].includes(element.type)) {
                addSlot(slots, element, 'content')
                // Le rendu privilégie richContent.segments quand il est présent
                if (Array.isArray(element.richContent?.segments)) {
                    for (const segment of element.richContent.segments) {
                        addSlot(slots, segment, 'text')
                        addSlot(slots, segment, 'linkText')
                    }
                }
            }

            if (element.type === 'image') {
                addSlot(slots, element, 'alt')
                addSlot(slots, element, 'caption')
            }

            // L'URL de la vidéo reste inchangée
            if (element.type === 'video') {
                addSlot(slots, element, 'caption')
            }

            if ((element.type === 'list' || element.type === 'ordered_list') && Array.isArray(element.items)) {
                element.items.forEach((_: string, index: number) => addSlot(slots, element.items, index))
            }

            if (element.type === 'accordion') {
                addSlot(slots, element, 'title')
                if (Array.isArray(element.items)) {
                    for (const item of element.items) {
                        addSlot(slots, item, 'title')
                        addSlot(slots, item, 'content')
                    }
                }
            }
        }
    }
}

/**
 * Traduit l'ensemble des champs textuels d'un SeoPost (y compris le contenu JSON)
 * en regroupant tous les textes dans quelques requêtes.
 */
async function translateAllFields(
    fields: FieldsToTranslate,
    targetLang: string,
    sourceLang: string
): Promise<Omit<TranslatedFields, 'slug'>> {
    const result = {
        title: fields.title,
        metaDescription: fields.metaDescription,
        excerpt: fields.excerpt,
        mainImageAlt: fields.mainImageAlt,
        mainImageCaption: fields.mainImageCaption,
        metaKeywords: [...fields.metaKeywords],
        listTags: [...fields.listTags]
    }

    const slots: TextSlot[] = []
    addSlot(slots, result, 'title')
    addSlot(slots, result, 'metaDescription')
    addSlot(slots, result, 'excerpt')
    addSlot(slots, result, 'mainImageAlt')
    addSlot(slots, result, 'mainImageCaption')
    result.metaKeywords.forEach((_, index) => addSlot(slots, result.metaKeywords, index))
    result.listTags.forEach((_, index) => addSlot(slots, result.listTags, index))

    let contentData: any[] | null = null
    try {
        const parsed = fields.content ? JSON.parse(fields.content) : null
        if (Array.isArray(parsed)) contentData = parsed
    } catch (error) {
        console.error('❌ Contenu JSON illisible, conservé tel quel:', error)
    }
    if (contentData) collectContentSlots(contentData, slots)

    const translatedTexts = await translateBatch(slots.map(slot => slot.text), targetLang, sourceLang)
    slots.forEach((slot, index) => slot.apply(translatedTexts[index]))

    return {
        ...result,
        content: contentData ? JSON.stringify(contentData, null, 2) : fields.content,
        status: fields.status,
        pinned: fields.pinned
    }
}

// Lève une erreur si la traduction échoue : l'appelant décide quoi faire
export async function translateSeoPostFields(
    fields: FieldsToTranslate,
    targetLanguageCode: string
): Promise<TranslatedFields> {
    // Vérifier que la langue cible existe en DB
    const targetLanguage = await prisma.language.findUnique({
        where: { code: targetLanguageCode }
    })

    if (!targetLanguage) {
        throw new Error(`Langue non trouvée: ${targetLanguageCode}`)
    }

    console.log(`🌍 Traduction vers ${targetLanguage.name} avec Google Translate`)
    const translated = await translateAllFields(fields, targetLanguageCode, 'fr')

    // Générer un slug SEO-friendly
    const slug = `${targetLanguageCode}-${translated.title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')}`

    return { ...translated, slug }
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
    try {
        const translated = await translateAllFields(fields, 'en', 'auto')
        return {
            translationFailed: false,
            fields: {
                ...translated,
                slug: translated.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
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
 * Les blocs "articles liés" référencent les posts français : dans une traduction,
 * on remplace titre et slug par ceux de la traduction correspondante (si elle existe)
 * pour que les liens générés pointent vers les articles dans la même langue.
 */
async function localizeRelatedArticles(
    blogContent: BlogContent,
    targetLanguageId: number
): Promise<BlogContent> {
    const relatedIds = blogContent.flatMap(section =>
        (section.elements || []).flatMap(element =>
            element.type === ElementType.RELATED_ARTICLES ? (element.posts || []).map(post => post.id) : []
        )
    )
    if (relatedIds.length === 0) return blogContent

    const translations = await prisma.seoPost.findMany({
        where: { originalPostId: { in: relatedIds }, languageId: targetLanguageId },
        select: { originalPostId: true, title: true, slug: true }
    })
    const translationByOriginalId = new Map(translations.map(t => [t.originalPostId, t]))

    return blogContent.map(section => ({
        ...section,
        elements: (section.elements || []).map(element => {
            if (element.type !== ElementType.RELATED_ARTICLES) return element
            return {
                ...element,
                posts: (element.posts || []).map(post => {
                    const translation = translationByOriginalId.get(post.id)
                    return translation ? { ...post, title: translation.title, slug: translation.slug } : post
                })
            }
        })
    }))
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
        const failedLanguages: string[] = []

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
                // Traduire uniquement les champs textuels et le contenu JSON : le HTML
                // français n'est PAS traduit par regex (les paragraphes contenant des
                // liens/gras, les listes <li> et les libellés statiques restaient en
                // français). Il est régénéré plus bas depuis le contenu traduit.
                const translatedFields = await translateSeoPostFields(
                    {
                        ...completeFieldsToTranslate,
                        generatedHtml: undefined,
                        jsonLd: undefined,
                        generatedArticleHtml: undefined
                    },
                    targetLanguage.code
                )

                let translatedBlogContent: BlogContent = []
                try {
                    translatedBlogContent = JSON.parse(translatedFields.content)
                } catch (error) {
                    console.error('Erreur lors du parsing du contenu traduit:', error)
                }
                translatedBlogContent = await localizeRelatedArticles(translatedBlogContent, targetLanguage.id)

                // Régénérer le HTML et le JSON-LD avec les générateurs localisés
                // (libellés statiques et format de date dans la langue cible)
                const seoPostData: SeoPostData = {
                    title: translatedFields.title,
                    metaDescription: translatedFields.metaDescription,
                    author: originalPost.author,
                    authorLink: originalPost.authorLink ?? undefined,
                    mainImageUrl: originalPost.mainImageUrl ?? undefined,
                    mainImageAlt: translatedFields.mainImageAlt || undefined,
                    mainImageCaption: translatedFields.mainImageCaption || undefined,
                    creationDate: originalPost.createdAt,
                    excerpt: translatedFields.excerpt || undefined,
                    blogContent: translatedBlogContent,
                    tags: translatedFields.metaKeywords,
                    languageCode: targetLanguage.code
                }
                const estimatedReadTime = calculateReadingTime(generateSeoHtml(seoPostData))
                const seoPostDataWithReadTime: SeoPostData = { ...seoPostData, estimatedReadTime }

                const updateData = {
                    title: translatedFields.title,
                    metaDescription: translatedFields.metaDescription,
                    metaKeywords: translatedFields.metaKeywords,
                    content: JSON.stringify(translatedBlogContent),
                    excerpt: translatedFields.excerpt,
                    listTags: translatedFields.listTags,
                    mainImageAlt: translatedFields.mainImageAlt,
                    mainImageCaption: translatedFields.mainImageCaption,
                    slug: translatedFields.slug,
                    // Champs HTML régénérés dans la langue cible
                    generatedHtml: generateSeoHtml(seoPostDataWithReadTime),
                    jsonLd: generateSeoJsonLd(seoPostDataWithReadTime),
                    generatedArticleHtml: generateArticleHtml(seoPostDataWithReadTime),
                    // Conserver les autres champs du post original
                    author: originalPost.author,
                    authorLink: originalPost.authorLink,
                    estimatedReadTime,
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
                failedLanguages.push(targetLanguage.name)
                // Continuer avec les autres langues même si une traduction échoue
            }
        }

        if (failedLanguages.length > 0) {
            return {
                success: false,
                message: `Traduction impossible (${failedLanguages.join(', ')}) : les services de traduction n'ont pas répondu, la traduction existante n'a pas été modifiée. Pour réessayer plus tard, cochez « Retraduire en anglais » puis réenregistrez l'article`,
                translationsCreated,
                translationsUpdated
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