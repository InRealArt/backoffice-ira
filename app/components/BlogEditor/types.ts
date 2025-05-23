export enum ElementType {
    H2 = 'h2',
    H3 = 'h3',
    PARAGRAPH = 'paragraph',
    IMAGE = 'image',
    VIDEO = 'video',
    LIST = 'list',
    ACCORDION = 'accordion'
}

export interface BaseElement {
    id: string
    type: ElementType
}

export interface TextElement extends BaseElement {
    content: string
}

export interface H2Element extends TextElement {
    type: ElementType.H2
}

export interface H3Element extends TextElement {
    type: ElementType.H3
}

export interface ParagraphElement extends TextElement {
    type: ElementType.PARAGRAPH
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

export type ContentElement = H2Element | H3Element | ParagraphElement | ImageElement | VideoElement | ListElement | AccordionElement

export interface BlogSection {
    id: string
    title: string
    elements: ContentElement[]
}

export type BlogContent = BlogSection[] 