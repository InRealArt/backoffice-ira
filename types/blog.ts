export type ContentElementType = 'h2' | 'h3' | 'paragraph' | 'image' | 'video' | 'list';

export interface ContentElement {
    id: string;
    type: ContentElementType;
    content: string;
    url?: string;          // Pour les images et vidéos
    alt?: string;          // Pour les images
    listItems?: string[];  // Pour les listes
}

export interface ContentSection {
    id: string;
    title?: string;
    elements: ContentElement[];
}

export type StructuredContent = ContentSection[];

export interface BlogPostFormValues {
    // Méta-données
    title: string;
    slug: string;
    excerpt: string;
    status: string;
    category: string;
    pinned?: boolean;

    // Données header
    author: string;
    authorLink: string;
    publishDate: string;

    // Données introduction
    introText: string;
    mainImageUrl: string;
    mainImageAlt: string;
    mainImageCaption: string;

    // Contenu principal (deux formats possibles)
    content: string;
    structuredContent?: StructuredContent;
    generatedHtml?: string; // HTML généré à partir du contenu structuré

    // Tags
    tags: string;
} 