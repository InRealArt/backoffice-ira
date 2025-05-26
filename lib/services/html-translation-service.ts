'use server'

// Interface pour les éléments HTML à traduire
interface HtmlElement {
    tag: string
    attributes: Record<string, string>
    content: string | HtmlElement[]
    isText: boolean
}

// Fonction de traduction avec Google Translate
async function translateWithGoogle(
    text: string,
    targetLang: string
): Promise<string> {
    if (!text || text.trim() === '') return text

    try {
        const response = await fetch(
            `https://translate.googleapis.com/translate_a/single?client=gtx&sl=fr&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`
        )
        const data = await response.json()
        return data[0][0][0] || text
    } catch (error) {
        console.error('Erreur Google Translate:', error)
        return text
    }
}

// Parser HTML simple pour extraire le texte
function parseHtmlForTranslation(html: string): { textNodes: string[], structure: string } {
    // Expressions régulières pour identifier les éléments à traduire
    const textPatterns = [
        // Contenu des balises de texte
        /<(title|h[1-6]|p|span|div|figcaption|meta[^>]*content="[^"]*"[^>]*>)([^<]*)</gi,
        // Attributs spécifiques
        /(<meta[^>]*(?:content|title|description)=")([^"]+)(")/gi,
        /(<[^>]*alt=")([^"]+)(")/gi,
        /(<[^>]*title=")([^"]+)(")/gi
    ]

    const textNodes: string[] = []
    let structure = html

    // Extraire tous les textes à traduire
    const allMatches: Array<{ text: string, fullMatch: string, index: number }> = []

    // Rechercher le contenu des balises de texte
    const contentRegex = /<(title|h[1-6]|p|span|div|figcaption|time)([^>]*)>([^<]+)<\/\1>/gi
    let match
    while ((match = contentRegex.exec(html)) !== null) {
        const text = match[3].trim()
        if (text && !isOnlyWhitespace(text) && !isUrl(text) && !isDate(text)) {
            allMatches.push({
                text,
                fullMatch: match[0],
                index: match.index
            })
        }
    }

    // Rechercher les attributs meta content
    const metaRegex = /<meta[^>]*content="([^"]+)"[^>]*>/gi
    while ((match = metaRegex.exec(html)) !== null) {
        const text = match[1].trim()
        if (text && !isOnlyWhitespace(text) && !isUrl(text)) {
            allMatches.push({
                text,
                fullMatch: match[0],
                index: match.index
            })
        }
    }

    // Rechercher les attributs alt et title
    const attrRegex = /<[^>]*(alt|title)="([^"]+)"[^>]*>/gi
    while ((match = attrRegex.exec(html)) !== null) {
        const text = match[2].trim()
        if (text && !isOnlyWhitespace(text) && !isUrl(text)) {
            allMatches.push({
                text,
                fullMatch: match[0],
                index: match.index
            })
        }
    }

    // Trier par index pour maintenir l'ordre
    allMatches.sort((a, b) => a.index - b.index)

    // Extraire les textes uniques
    const uniqueTexts = [...new Set(allMatches.map(m => m.text))]
    textNodes.push(...uniqueTexts)

    return { textNodes, structure }
}

// Fonction pour vérifier si c'est seulement des espaces
function isOnlyWhitespace(text: string): boolean {
    return /^\s*$/.test(text)
}

// Fonction pour vérifier si c'est une URL
function isUrl(text: string): boolean {
    return /^https?:\/\//.test(text) || text.includes('firebasestorage.googleapis.com')
}

// Fonction pour vérifier si c'est une date
function isDate(text: string): boolean {
    return /^\d{4}-\d{2}-\d{2}$/.test(text) || /^\d{1,2}\s+\w+\s+\d{4}$/.test(text)
}

// Fonction pour remplacer le texte dans le HTML
function replaceTextInHtml(
    html: string,
    originalTexts: string[],
    translatedTexts: string[]
): string {
    let result = html

    for (let i = 0; i < originalTexts.length; i++) {
        const original = originalTexts[i]
        const translated = translatedTexts[i]

        if (original && translated && original !== translated) {
            // Remplacer dans le contenu des balises
            const contentRegex = new RegExp(
                `(<(?:title|h[1-6]|p|span|div|figcaption|time)[^>]*>)([^<]*${escapeRegex(original)}[^<]*)(</\\w+>)`,
                'gi'
            )
            result = result.replace(contentRegex, (match, openTag, content, closeTag) => {
                const newContent = content.replace(new RegExp(escapeRegex(original), 'gi'), translated)
                return openTag + newContent + closeTag
            })

            // Remplacer dans les attributs meta content
            const metaRegex = new RegExp(
                `(<meta[^>]*content=")([^"]*${escapeRegex(original)}[^"]*)("[^>]*>)`,
                'gi'
            )
            result = result.replace(metaRegex, (match, before, content, after) => {
                const newContent = content.replace(new RegExp(escapeRegex(original), 'gi'), translated)
                return before + newContent + after
            })

            // Remplacer dans les attributs alt et title
            const attrRegex = new RegExp(
                `(<[^>]*(?:alt|title)=")([^"]*${escapeRegex(original)}[^"]*)("[^>]*>)`,
                'gi'
            )
            result = result.replace(attrRegex, (match, before, content, after) => {
                const newContent = content.replace(new RegExp(escapeRegex(original), 'gi'), translated)
                return before + newContent + after
            })
        }
    }

    return result
}

// Fonction pour échapper les caractères spéciaux regex
function escapeRegex(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// Fonction principale pour traduire le HTML
export async function translateHtmlContent(
    html: string,
    targetLanguageCode: string
): Promise<string> {
    if (!html || html.trim() === '') return html

    try {
        console.log(`🌐 Traduction du contenu HTML vers ${targetLanguageCode}`)

        // Parser le HTML pour extraire les textes
        const { textNodes } = parseHtmlForTranslation(html)

        if (textNodes.length === 0) {
            console.log('Aucun texte à traduire trouvé dans le HTML')
            return html
        }

        console.log(`📝 ${textNodes.length} éléments textuels trouvés à traduire`)

        // Traduire tous les textes
        const translatedTexts = await Promise.all(
            textNodes.map(text => translateWithGoogle(text, targetLanguageCode))
        )

        // Remplacer les textes dans le HTML
        const translatedHtml = replaceTextInHtml(html, textNodes, translatedTexts)

        // Mettre à jour l'attribut lang si présent
        const langRegex = /<html[^>]*lang="[^"]*"/gi
        const updatedHtml = translatedHtml.replace(langRegex, (match) => {
            return match.replace(/lang="[^"]*"/, `lang="${targetLanguageCode}"`)
        })

        console.log('✅ Traduction HTML terminée')
        return updatedHtml

    } catch (error) {
        console.error('❌ Erreur lors de la traduction HTML:', error)
        return html // Retourner le HTML original en cas d'erreur
    }
}

// Fonction pour traduire le JSON-LD
export async function translateJsonLd(
    jsonLd: string,
    targetLanguageCode: string
): Promise<string> {
    if (!jsonLd || jsonLd.trim() === '') return jsonLd

    try {
        console.log(`🔍 Traduction du JSON-LD vers ${targetLanguageCode}`)

        const data = JSON.parse(jsonLd)

        // Champs à traduire dans le JSON-LD
        const fieldsToTranslate = ['name', 'headline', 'description', 'alternativeHeadline']

        for (const field of fieldsToTranslate) {
            if (data[field] && typeof data[field] === 'string') {
                data[field] = await translateWithGoogle(data[field], targetLanguageCode)
            }
        }

        // Traduire les éléments dans les tableaux si présents
        if (data.keywords && Array.isArray(data.keywords)) {
            data.keywords = await Promise.all(
                data.keywords.map((keyword: string) => translateWithGoogle(keyword, targetLanguageCode))
            )
        }

        console.log('✅ Traduction JSON-LD terminée')
        return JSON.stringify(data, null, 2)

    } catch (error) {
        console.error('❌ Erreur lors de la traduction JSON-LD:', error)
        return jsonLd // Retourner le JSON-LD original en cas d'erreur
    }
}

// Fonction pour traduire le contenu d'article HTML
export async function translateArticleHtml(
    articleHtml: string,
    targetLanguageCode: string
): Promise<string> {
    // Utiliser la même fonction que pour le HTML complet
    return translateHtmlContent(articleHtml, targetLanguageCode)
} 