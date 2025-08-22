export enum ElementType {
    H2 = 'h2',
    H3 = 'h3',
    PARAGRAPH = 'paragraph',
    IMAGE = 'image',
    VIDEO = 'video',
    LIST = 'list',
    ORDERED_LIST = 'ordered_list',
    ACCORDION = 'accordion'
}

// Types pour le contenu riche avec liens
export interface TextSegment {
    id: string
    text: string
    isLink: boolean
    linkUrl?: string
    linkText?: string
    isBold?: boolean
    isItalic?: boolean
    isUnderline?: boolean
}

export interface RichContent {
    segments: TextSegment[]
}

export interface BaseElement {
    id: string
    type: ElementType
}

export interface TextElement extends BaseElement {
    content: string
}

// Nouveau type pour les paragraphes avec contenu riche
export interface RichTextElement extends BaseElement {
    richContent: RichContent
}

export interface H2Element extends TextElement {
    type: ElementType.H2
}

export interface H3Element extends TextElement {
    type: ElementType.H3
}

// Mise à jour du ParagraphElement pour supporter le contenu riche
export interface ParagraphElement extends BaseElement {
    type: ElementType.PARAGRAPH
    content: string
    richContent?: RichContent // Optionnel pour la rétrocompatibilité
}

export interface ImageElement extends BaseElement {
    type: ElementType.IMAGE
    url: string
    alt: string
    caption?: string
}

export interface VideoElement extends BaseElement {
    type: ElementType.VIDEO
    url: string
    caption?: string
}

export interface ListElement extends BaseElement {
    type: ElementType.LIST
    items: string[]
}

export interface OrderedListElement extends BaseElement {
    type: ElementType.ORDERED_LIST
    items: string[]
}

export interface AccordionItemData {
    id: string
    title: string
    content: string
}

export interface AccordionElement extends BaseElement {
    type: ElementType.ACCORDION
    title?: string
    items: AccordionItemData[]
}

export type ContentElement = H2Element | H3Element | ParagraphElement | ImageElement | VideoElement | ListElement | OrderedListElement | AccordionElement

export interface BlogSection {
    id: string
    title: string
    elements: ContentElement[]
}

export type BlogContent = BlogSection[] 