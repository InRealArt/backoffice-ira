import mammoth from 'mammoth'
import { v4 as uuidv4 } from 'uuid'
import { generateSlug } from '@/lib/utils'
import type { BlogContent, BlogSection, ContentElement, ElementType } from '@/app/components/BlogEditor/types'

// mammoth n'a pas de types publiés — on déclare les types minimaux nécessaires
interface MammothParagraph {
    type: 'paragraph'
    styleId?: string
    styleName?: string
    numbering?: { level: number; numId: number } | null
    children: MammothRun[]
}

interface MammothRun {
    type: 'run'
    value?: string
    children?: Array<{ type: string; value?: string }>
    isBold?: boolean
    isItalic?: boolean
    isUnderline?: boolean
}

interface MammothTable {
    type: 'table'
    children: unknown[]
}

type MammothChild = MammothParagraph | MammothTable | { type: string }

interface MammothDocument {
    children: MammothChild[]
}

export interface DocxParseResult {
    title: string
    metaDescription: string
    metaKeywords: string[]
    tags: string[]
    author: string
    excerpt: string
    categoryName: string
    categoryId?: number
    blogContent: BlogContent
    slug: string
}

// Extrait le texte brut d'un paragraphe mammoth
function extractText(paragraph: MammothParagraph): string {
    const parts: string[] = []
    for (const child of paragraph.children ?? []) {
        if (child.value) {
            parts.push(child.value)
        } else if (child.children) {
            for (const sub of child.children) {
                if (sub.value) parts.push(sub.value)
            }
        }
    }
    return parts.join('').trim()
}

// Détecte si un paragraphe est une liste à puce (non ordonnée) selon le style Word
function isUnorderedList(paragraph: MammothParagraph): boolean {
    const styleName = (paragraph.styleName ?? '').toLowerCase()
    const styleId = (paragraph.styleId ?? '').toLowerCase()
    // ListParagraph sans numérotation → puce
    if (paragraph.numbering) return false
    return (
        styleName.includes('list') ||
        styleId.includes('list') ||
        styleName.includes('listparagraph') ||
        styleId === 'listparagraph'
    )
}

// Détecte si un paragraphe est une liste ordonnée
function isOrderedList(paragraph: MammothParagraph): boolean {
    return !!paragraph.numbering
}

// Détecte le "niveau" de heading (1, 2, 3) ou null
function getHeadingLevel(paragraph: MammothParagraph): number | null {
    const styleName = (paragraph.styleName ?? '').toLowerCase()
    const styleId = (paragraph.styleId ?? '').toLowerCase()
    if (styleName.startsWith('heading 1') || styleId === 'heading1' || styleId === 'titre1') return 1
    if (styleName.startsWith('heading 2') || styleId === 'heading2' || styleId === 'titre2') return 2
    if (styleName.startsWith('heading 3') || styleId === 'heading3' || styleId === 'titre3') return 3
    // Heading numériques : "Titre 1", "Titre 2", etc.
    const matchFr = styleName.match(/^titre\s*(\d)/)
    if (matchFr) return parseInt(matchFr[1], 10)
    const matchEn = styleName.match(/^heading\s*(\d)/)
    if (matchEn) return parseInt(matchEn[1], 10)
    return null
}

// Phase 1 : extraire les métadonnées depuis les premières lignes du document
const META_KEYS_MAP: Record<string, keyof Pick<DocxParseResult, 'title' | 'metaDescription' | 'author' | 'excerpt' | 'categoryName'> | 'keywords' | 'tags'> = {
    'meta title': 'title',
    'meta description': 'metaDescription',
    'keywords': 'keywords',
    'tags': 'tags',
    'auteur': 'author',
    'author': 'author',
    'catégorie': 'categoryName',
    'categorie': 'categoryName',
    'category': 'categoryName',
    'excerpt': 'excerpt',
    'résumé': 'excerpt',
    'resume': 'excerpt',
}

function parseMetadata(paragraphs: MammothParagraph[]): {
    meta: Partial<DocxParseResult>
    contentStart: number
} {
    const meta: Partial<DocxParseResult> = {
        metaKeywords: [],
        tags: [],
    }
    let contentStart = 0

    for (let i = 0; i < paragraphs.length; i++) {
        const para = paragraphs[i]
        // Dès qu'on rencontre un Heading 1, on s'arrête
        if (getHeadingLevel(para) === 1) {
            contentStart = i
            break
        }

        const text = extractText(para)
        if (!text) continue

        // Essayer de matcher une ligne metadata
        const match = text.match(/^([^:]+?)\s*:\s*(.+)$/)
        if (match) {
            const rawKey = match[1].trim().toLowerCase()
            const value = match[2].trim()
            const mappedKey = META_KEYS_MAP[rawKey]

            if (mappedKey === 'keywords') {
                meta.metaKeywords = value.split(/,\s*/).map(s => s.trim()).filter(Boolean)
            } else if (mappedKey === 'tags') {
                meta.tags = value.split(/,\s*/).map(s => s.trim()).filter(Boolean)
            } else if (mappedKey) {
                (meta as any)[mappedKey] = value
            }
            // On continue même si la clé n'est pas reconnue
        }
        // Si la ligne ne ressemble pas à un metadata ET qu'on a déjà des metadata, on arrête
        else if (Object.keys(meta).length > 2) {
            contentStart = i
            break
        }

        contentStart = i + 1
    }

    return { meta, contentStart }
}

// Extrait les tableaux HTML depuis le HTML complet généré par mammoth
function extractTablesHtml(fullHtml: string): string[] {
    const tables: string[] = []
    const regex = /<table[\s\S]*?<\/table>/g
    let match
    while ((match = regex.exec(fullHtml)) !== null) {
        tables.push(match[0])
    }
    return tables
}

// Phase 2 : construire le BlogContent depuis les enfants mixtes (paragraphes + tables)
function buildBlogContentMixed(
    children: MammothChild[],
    tablesHtml: string[],
    defaultTitle: string
): BlogContent {
    const sections: BlogSection[] = []
    let currentSection: BlogSection | null = null

    let pendingUnorderedItems: string[] = []
    let pendingOrderedItems: string[] = []
    let tableIndex = 0

    const flushLists = () => {
        if (!currentSection) return
        if (pendingUnorderedItems.length > 0) {
            currentSection.elements.push({
                id: uuidv4(),
                type: 'list' as ElementType,
                items: [...pendingUnorderedItems],
            } as ContentElement)
            pendingUnorderedItems = []
        }
        if (pendingOrderedItems.length > 0) {
            currentSection.elements.push({
                id: uuidv4(),
                type: 'ordered_list' as ElementType,
                items: [...pendingOrderedItems],
            } as ContentElement)
            pendingOrderedItems = []
        }
    }

    const ensureSection = () => {
        if (!currentSection) {
            currentSection = {
                id: uuidv4(),
                title: defaultTitle,
                elements: [],
            }
            sections.push(currentSection)
        }
    }

    for (const child of children) {
        // Tableau : insérer le HTML brut comme ParagraphElement avec content = '<table>...</table>'
        if (child.type === 'table') {
            flushLists()
            ensureSection()
            const html = tablesHtml[tableIndex] ?? ''
            tableIndex++
            if (html) {
                currentSection!.elements.push({
                    id: uuidv4(),
                    type: 'paragraph' as ElementType,
                    content: html,
                } as ContentElement)
            }
            continue
        }

        if (child.type !== 'paragraph') continue

        const para = child as MammothParagraph
        const text = extractText(para)
        const headingLevel = getHeadingLevel(para)

        if (headingLevel === 1) {
            flushLists()
            currentSection = {
                id: uuidv4(),
                title: text || 'Section',
                elements: [],
            }
            sections.push(currentSection)
            continue
        }

        if (headingLevel === 2) {
            flushLists()
            ensureSection()
            if (text) {
                currentSection!.elements.push({
                    id: uuidv4(),
                    type: 'h2' as ElementType,
                    content: text,
                } as ContentElement)
            }
            continue
        }

        if (headingLevel === 3) {
            flushLists()
            ensureSection()
            if (text) {
                currentSection!.elements.push({
                    id: uuidv4(),
                    type: 'h3' as ElementType,
                    content: text,
                } as ContentElement)
            }
            continue
        }

        if (isOrderedList(para)) {
            if (pendingUnorderedItems.length > 0) flushLists()
            ensureSection()
            if (text) pendingOrderedItems.push(text)
            continue
        }

        if (isUnorderedList(para)) {
            if (pendingOrderedItems.length > 0) flushLists()
            ensureSection()
            if (text) pendingUnorderedItems.push(text)
            continue
        }

        // Paragraphe normal
        flushLists()
        if (text) {
            ensureSection()
            currentSection!.elements.push({
                id: uuidv4(),
                type: 'paragraph' as ElementType,
                content: text,
            } as ContentElement)
        }
    }

    flushLists()
    return sections
}

export async function parseDocxBuffer(buffer: Buffer): Promise<DocxParseResult> {
    let rawDocument: MammothDocument | null = null

    const htmlResult = await mammoth.convertToHtml(
        { buffer },
        {
            transformDocument: (doc: MammothDocument) => {
                rawDocument = doc
                return doc
            },
        }
    )

    if (!rawDocument) {
        throw new Error('Impossible de lire le document DOCX')
    }

    // Extraire les tableaux HTML depuis le rendu HTML complet
    const tablesHtml = extractTablesHtml(htmlResult.value)

    const orderedChildren = (rawDocument as MammothDocument).children

    // Phase 1 : métadonnées (sur les paragraphes uniquement)
    const paragraphsOnly = orderedChildren.filter(
        (c) => c.type === 'paragraph'
    ) as MammothParagraph[]

    const { meta, contentStart } = parseMetadata(paragraphsOnly)
    const title = meta.title || ''

    // Retrouver l'index global correspondant à contentStart dans paragraphsOnly
    let paragraphsSeen = 0
    let globalContentStart = orderedChildren.length
    for (let i = 0; i < orderedChildren.length; i++) {
        if (orderedChildren[i].type === 'paragraph') {
            if (paragraphsSeen === contentStart) {
                globalContentStart = i
                break
            }
            paragraphsSeen++
        }
    }

    const contentChildren = orderedChildren.slice(globalContentStart)

    // Les tableaux avant globalContentStart sont des tableaux de métadonnées (rare) — on les ignore
    // On calcule combien de tables sont dans les métadonnées pour indexer correctement
    const tablesBeforeContent = orderedChildren
        .slice(0, globalContentStart)
        .filter(c => c.type === 'table').length
    const contentTablesHtml = tablesHtml.slice(tablesBeforeContent)

    const blogContent = buildBlogContentMixed(contentChildren, contentTablesHtml, title || 'Article')

    return {
        title,
        metaDescription: meta.metaDescription || '',
        metaKeywords: meta.metaKeywords ?? [],
        tags: meta.tags ?? [],
        author: meta.author || '',
        excerpt: meta.excerpt || '',
        categoryName: meta.categoryName || '',
        blogContent,
        slug: generateSlug(title),
    }
}
