
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { PostStatus } from '@prisma/client'
import { BlogPostFormValues, StructuredContent } from '@/types/blog'

// Préfixe pour identifier le contenu structuré (pour la rétrocompatibilité avec l'ancien format)
const STRUCTURED_CONTENT_PREFIX = '<!-- STRUCTURED_CONTENT_JSON:'
const STRUCTURED_CONTENT_SUFFIX = '-->'

// Fonction pour encoder le contenu structuré (conservée pour compatibilité)
function encodeStructuredContent(rawContent: string, structuredContent?: StructuredContent): string {
    if (!structuredContent) {
        return rawContent
    }

    // On stocke uniquement le JSON structuré
    return JSON.stringify(structuredContent)
}

// Fonction pour décoder le contenu structuré
function decodeStructuredContent(content: string): { rawContent: string, structuredContent?: StructuredContent } {
    // Si le contenu est vide ou null
    if (!content) {
        return { rawContent: '' };
    }

    try {
        // Vérifier d'abord si c'est un JSON valide (notre format principal maintenant)
        try {
            const structuredContent = JSON.parse(content) as StructuredContent;

            if (Array.isArray(structuredContent) && structuredContent.length > 0) {
                console.log('Format détecté: JSON pur (format standard)');
                // Générer le HTML à partir du JSON pour l'affichage
                const rawContent = generateRawContentFromSections(structuredContent);
                return { rawContent, structuredContent };
            }
        } catch (jsonError) {
            // Pas un JSON valide, essayons l'ancien format avec commentaires
        }

        // Vérifier si c'est l'ancien format avec JSON dans commentaires
        if (content.startsWith(STRUCTURED_CONTENT_PREFIX)) {
            const endOfJson = content.indexOf(STRUCTURED_CONTENT_SUFFIX);
            if (endOfJson !== -1) {
                // Extraire le JSON des commentaires
                const jsonStr = content.substring(STRUCTURED_CONTENT_PREFIX.length, endOfJson);
                const structuredContent = JSON.parse(jsonStr) as StructuredContent;

                // Extraire le contenu HTML après les marqueurs
                const rawContent = content.substring(endOfJson + STRUCTURED_CONTENT_SUFFIX.length).trim();

                console.log('Format détecté: JSON en commentaire + HTML (ancien format)');
                return { rawContent, structuredContent };
            }
        }

        // Si on arrive ici, c'est probablement du HTML pur ou un autre format non reconnu
        console.log('Detected format: HTML pure or unknown format (fallback)');
        return { rawContent: content };
    } catch (e) {
        console.error('Error when decoding the structured content:', e);
        // En cas d'erreur, retourner le contenu tel quel
        return { rawContent: content };
    }
}

// Fonction pour générer le contenu HTML à partir des sections structurées
function generateRawContentFromSections(sectionsArray: StructuredContent, postData?: any): string {
    // Générer le contenu HTML des sections
    const sectionsContent = sectionsArray.map(section => {
        const sectionContent = section.elements.map((element: any) => {
            switch (element.type) {
                case 'h2':
                    return `  <br/><h2 style="font-family: 'Bebas Neue Bold', 'Impact', sans-serif; text-transform: uppercase; letter-spacing: 1px; margin-top: 2rem;">${element.content}</h2>`
                case 'h3':
                    return `  <br/><h3 style="font-family: 'Bebas Neue Bold', 'Impact', sans-serif; text-transform: uppercase; letter-spacing: 1px; margin-top: 1.5rem;">${element.content}</h3>`
                case 'paragraph':
                    return `  <p style="font-family: 'Poppins', sans-serif; font-weight: 400;">${element.content}</p>`
                case 'list':
                    if (element.listItems && element.listItems.length > 0) {
                        const listItems = element.listItems.map((item: string) => `    <li style="font-family: 'Poppins', sans-serif; font-weight: 400;">${item}</li>`).join('\n')
                        return `  <ul style="font-family: 'Poppins', sans-serif; font-weight: 400;">\n${listItems}\n  </ul>`
                    }
                    return ''
                case 'image':
                    return `  <figure>\n    <img src="${element.url || ''}" alt="${element.alt || ''}" />\n    <figcaption>${element.content}</figcaption>\n  </figure>`
                case 'video':
                    // Simplifiée pour l'exemple
                    const isYouTubeUrl = (element.url || '').includes('youtube.com') || (element.url || '').includes('youtu.be')
                    if (isYouTubeUrl) {
                        const youtubeId = extractYouTubeId(element.url || '')
                        return `  <figure class="video">\n    <iframe width="560" height="315" src="https://www.youtube.com/embed/${youtubeId}" frameborder="0" allowfullscreen></iframe>\n    <figcaption>${element.content}</figcaption>\n  </figure>`
                    } else {
                        return `  <figure class="video">\n    <video controls src="${element.url || ''}"></video>\n    <figcaption>${element.content}</figcaption>\n  </figure>`
                    }
                default:
                    return `  <p>${element.content}</p>`
            }
        }).join('\n\n')

        return `<section>\n${sectionContent}\n</section>`
    }).join('\n\n')

    // Extraire les données du post pour les métadonnées si disponibles
    const title = postData?.title || 'Article de blog';
    const description = postData?.metaDescription || postData?.excerpt || '';
    const authorName = postData?.author || '';
    const mainImageUrl = postData?.mainImageUrl || '';
    const mainImageAlt = postData?.mainImageAlt || '';
    const mainImageCaption = postData?.mainImageCaption || '';
    const introText = postData?.introText || '';
    const tags = postData?.tags || '';

    // Générer le HTML des tags en utilisant notre fonction utilitaire
    const tagsHTML = generateTagsHTML(tags);

    // Générer la page HTML complète avec le contenu des sections, sans les tags dupliqués
    return `<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <meta name="description" content="${description}">
    ${authorName ? `<meta name="author" content="${authorName}">` : ''}
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    ${mainImageUrl ? `<meta property="og:image" content="${mainImageUrl}">` : ''}
    <meta property="og:type" content="article">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Poppins:wght@300;400;500&display=swap" rel="stylesheet">
    <style>
        body {
            font-family: 'Arial', sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
        }
        h1 {
            font-size: 2.5em;
            margin-bottom: 0.5em;
        }
        h2 {
            font-size: 1.8em;
            margin-top: 1.5em;
            margin-bottom: 0.5em;
        }
        h3 {
            font-size: 1.4em;
            margin-top: 1.2em;
            margin-bottom: 0.5em;
        }
        p {
            margin-bottom: 1em;
        }
        figure {
            margin: 2em 0;
        }
        img {
            max-width: 100%;
            height: auto;
            display: block;
            margin: 0 auto;
        }
        figcaption {
            text-align: center;
            font-style: italic;
            margin-top: 0.5em;
            color: #666;
        }
        .article-meta {
            font-size: 0.9em;
            color: #666;
            margin-bottom: 2em;
        }
        .article-intro {
            font-size: 1.1em;
            line-height: 1.8;
            margin-bottom: 2em;
        }
        .main-image {
            margin: 2em 0;
        }
        @media (prefers-color-scheme: dark) {
            body {
                color: #e5e7eb;
                background-color: #1f2937;
            }
            h1, h2, h3 {
                color: #f9fafb;
            }
            p {
                color: #d1d5db;
            }
            figcaption {
                color: #9ca3af;
            }
            .article-meta {
                color: #9ca3af;
            }
        }
    </style>
</head>
<body style="font-family: 'Poppins', 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px;">
    <article>
        <header>
            <h1 style="font-family: 'Bebas Neue Bold', 'Impact', sans-serif; text-transform: uppercase; letter-spacing: 1px;">${title}</h1>
            <div class="article-meta" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    ${authorName ? `<span class="author" style="font-family: 'Poppins', sans-serif; font-weight: 500;">Par ${authorName}</span>` : ''}
                    ${postData?.createdAt ? `<time datetime="${new Date(postData.createdAt).toISOString().split('T')[0]}" style="font-family: 'Poppins', sans-serif; opacity: 0.8; font-size: 0.9em;">${new Date(postData.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' })}</time>` : ''}
                </div>
                ${postData?.category?.name ? (() => {
            const categoryColors = getCategoryColor(postData.category.name);
            return `<span style="display: inline-block; background-color: ${categoryColors.bg}; color: ${categoryColors.text}; border: 1px solid ${categoryColors.border}; padding: 0.25rem 0.75rem; border-radius: 9999px; font-family: 'Poppins', sans-serif; font-size: 0.875rem; font-weight: 500;">${postData.category.name}</span>`;
        })() : ''}
            </div>
            ${mainImageUrl ?
            `<figure class="main-image">
                    <img src="${mainImageUrl}" alt="${mainImageAlt}" />
                    ${mainImageCaption ? `<figcaption>${mainImageCaption}</figcaption>` : ''}
                </figure>` : ''
        }
            ${introText ? `<div class="article-intro" style="font-family: 'Poppins', sans-serif; font-weight: 400;">${introText}</div>` : ''}
        </header>
        <div class="article-content">
${sectionsContent}
${tagsHTML}
        </div>
    </article>
</body>
</html>`
}

// Fonction pour extraire l'ID YouTube d'une URL
function extractYouTubeId(url: string): string {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
    const match = url.match(regExp)
    return (match && match[2].length === 11) ? match[2] : ''
}

// Fonction pour générer le JSON-LD pour les articles de blog
function generateJsonLd(postData: any): string {
    // URL du logo RetroVRS
    const logoUrl = 'http://localhost:3000/_next/image?url=%2Fimages%2Flogos%2Fretro%2FRetro_logo_1.png&w=256&q=75';

    // Date actuelle formatée en ISO pour la date de modification
    const modifiedDate = new Date().toISOString();

    // Date de publication (soit depuis les données du post, soit la date actuelle)
    const publishDate = postData.publishDate || postData.createdAt || new Date().toISOString();

    // Construction de l'objet JSON-LD avec typage approprié
    const jsonLd: {
        "@context": string;
        "@type": string;
        "headline": string;
        "image": string;
        "datePublished": string;
        "dateModified": string;
        "author": {
            "@type": string;
            "name": string;
            "url"?: string;
        };
        "publisher": {
            "@type": string;
            "name": string;
            "logo": {
                "@type": string;
                "url": string;
            }
        };
        "description": string;
    } = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": postData.title || '',
        "image": postData.mainImageUrl || '',
        "datePublished": publishDate,
        "dateModified": modifiedDate,
        "author": {
            "@type": "Person",
            "name": postData.author || ''
        },
        "publisher": {
            "@type": "Organization",
            "name": "RetroVRS Marketplace",
            "logo": {
                "@type": "ImageObject",
                "url": logoUrl
            }
        },
        "description": postData.metaDescription || postData.excerpt || ''
    };

    // Si l'auteur a un lien, l'ajouter
    if (postData.authorLink) {
        jsonLd.author.url = postData.authorLink;
    }

    return JSON.stringify(jsonLd, null, 2);
}

// Fonction pour extraire uniquement la partie <article> du HTML généré
function extractArticleContent(fullHtml: string): string {
    if (!fullHtml) return '';

    try {
        // Essayer d'extraire tout ce qui est entre les balises <article> et </article>
        const articleRegex = /<article>([\s\S]*?)<\/article>/i;
        const match = fullHtml.match(articleRegex);

        if (match && match[1]) {
            // Renvoyer le contenu de l'article en ajoutant les balises ouvrantes et fermantes
            return `<article>${match[1]}</article>`;
        }

        // Si nous n'avons pas trouvé de balise article, essayons une autre approche
        // en recherchant le corps du document
        const bodyRegex = /<body[^>]*>([\s\S]*?)<\/body>/i;
        const bodyMatch = fullHtml.match(bodyRegex);

        if (bodyMatch && bodyMatch[1]) {
            // S'il y a un contenu dans le body mais pas d'article,
            // créons un article à partir du contenu du body
            const bodyContent = bodyMatch[1].trim();

            // Cherchons si un élément article existe dans le body
            const articleInBodyRegex = /<article[^>]*>([\s\S]*?)<\/article>/i;
            const articleInBodyMatch = bodyContent.match(articleInBodyRegex);

            if (articleInBodyMatch && articleInBodyMatch[0]) {
                return articleInBodyMatch[0];
            }

            // Si toujours pas d'article, on prend tout le contenu du body en l'encapsulant
            // dans des balises article
            return `<article>${bodyContent}</article>`;
        }

        console.log('Aucun contenu d\'article ou de body trouvé dans le HTML');
        return '';
    } catch (error) {
        console.error('Erreur lors de l\'extraction du contenu de l\'article:', error);
        return '';
    }
}

// Fonction utilitaire pour générer le HTML des tags
function generateTagsHTML(tags: string | string[]): string {
    if (!tags) return '';

    // On s'assure de traiter correctement les tags, qu'ils soient sous forme de chaîne ou de tableau
    let tagsArray: string[] = [];

    if (typeof tags === 'string') {
        tagsArray = tags.split(',').map(tag => tag.trim()).filter(Boolean);
    } else if (Array.isArray(tags)) {
        tagsArray = tags.filter(Boolean);
    }

    if (tagsArray.length === 0) return '';

    const tagsList = tagsArray
        .map((tag: string) => {
            const tagSlug = tag.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-')
            return `    <li><a href="/blog/tags/${tagSlug}" rel="tag" style="display: inline-block; background-color: #f0f0f0; color: #333; font-size: 0.875rem; padding: 0.25rem 0.75rem; margin: 0.25rem; border-radius: 9999px; text-decoration: none; transition: background-color 0.2s, color 0.2s; border: 1px solid #ddd; font-weight: 500;">
  ${tag}
  <style>
    @media (prefers-color-scheme: dark) {
      a[rel="tag"] {
        background-color: #374151;
        color: #e5e7eb;
        border-color: #4b5563;
      }
      a[rel="tag"]:hover {
        background-color: #4b5563;
      }
    }
    a[rel="tag"]:hover {
      background-color: #e0e0e0;
    }
  </style>
</a></li>`
        })
        .join('\n')

    return `
<section class="tags" style="margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid #eaeaea;">
  <h2 style="font-size: 1.25rem; margin-bottom: 0.75rem;">Tags</h2>
  <ul style="list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 0.25rem;">
${tagsList}
  </ul>
  <style>
    @media (prefers-color-scheme: dark) {
      .tags {
        border-top-color: #374151;
      }
      .tags h2 {
        color: #e5e7eb;
      }
    }
  </style>
</section>`;
}

// Fonction pour obtenir la couleur associée à une catégorie
function getCategoryColor(category: string): { bg: string, text: string, border: string } {
    // Par défaut
    let bg = '#9C27B0'; // Violet
    let text = '#FFFFFF';
    let border = '#7B1FA2';

    // Couleurs selon la catégorie (convertir en minuscules pour faciliter la comparaison)
    const categoryLower = category.toLowerCase();

    if (categoryLower.includes('provenance')) {
        bg = '#6A1B9A'; // Violet très foncé
        text = '#FFFFFF';
        border = '#4A148C';
    } else if (categoryLower.includes('blog') || categoryLower === 'blog') {
        bg = '#00796B'; // Vert teal foncé
        text = '#FFFFFF';
        border = '#004D40';
    } else if (categoryLower.includes('news') || categoryLower.includes('actualité')) {
        bg = '#D81B60'; // Fuchsia/magenta
        text = '#FFFFFF';
        border = '#AD1457';
    } else if (categoryLower.includes('guide') || categoryLower.includes('tutorial')) {
        bg = '#F57F17'; // Jaune orangé
        text = '#000000';
        border = '#E65100';
    }

    return { bg, text, border };
}

export async function createBlogPost(formData: BlogPostFormValues) {
    try {

        console.log('Starting blog post creation with data:', {
            title: formData.title,
            slug: formData.slug,
            category: formData.category,
            tags: formData.tags
        })

        // Log structured content for debugging
        console.log('structuredContent disponible:', !!formData.structuredContent);

        if (formData.structuredContent) {
            console.log('structuredContent aperçu:',
                JSON.stringify(formData.structuredContent).substring(0, 200) + '...');

            // Vérifier que c'est bien un tableau
            if (!Array.isArray(formData.structuredContent)) {
                console.error('structuredContent n\'est pas un tableau valide!');
                try {
                    // Tentative de parser si c'est une chaîne JSON
                    if (typeof formData.structuredContent === 'string') {
                        formData.structuredContent = JSON.parse(formData.structuredContent);
                        console.log('structuredContent parsed successfully from the JSON string');
                    } else {
                        console.error('structuredContent is of invalid type:', typeof formData.structuredContent);
                    }
                } catch (err) {
                    console.error('Error when parsing structuredContent:', err);
                }
            }
        } else {
            console.log('No structured content available, default creation');
            // Créer un contenu structuré par défaut si inexistant
            formData.structuredContent = [{
                id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
                elements: [{
                    id: crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2),
                    type: 'paragraph',
                    content: formData.content || 'Nouveau contenu'
                }]
            }];
            console.log('Default structured content created:', formData.structuredContent);
        }

        // Find the category ID or create a new one
        const category = await prisma.seoCategory.upsert({
            where: { name: formData.category },
            update: {},
            create: {
                name: formData.category,
                shortDescription: `Category for ${formData.category} posts`,
            },
        })

        console.log('Category found/created:', category)

        // Parse tags
        let parsedTags: string[] = []
        try {
            if (formData.tags) {
                if (formData.tags.startsWith('[')) {
                    // Try parsing as JSON
                    parsedTags = JSON.parse(formData.tags)
                    console.log('Tags parsed as JSON:', parsedTags)
                } else {
                    // Parse as comma-separated string
                    parsedTags = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
                    console.log('Tags parsed as comma-separated:', parsedTags)
                }
            }
        } catch (error) {
            console.error('Error parsing tags:', error)
            parsedTags = []
        }

        // Set the proper status as an enum value
        const status: PostStatus = formData.status === 'published' ? PostStatus.PUBLISHED : PostStatus.DRAFT

        // Stocker uniquement le JSON structuré dans le champ content
        // Si structuredContent n'existe pas, on stocke le contenu brut comme fallback
        const content = formData.structuredContent
            ? JSON.stringify(formData.structuredContent)
            : formData.content;

        // Préparer les données complètes du post pour générer le HTML
        const postDataForHTML = {
            title: formData.title,
            metaDescription: formData.excerpt,
            excerpt: formData.introText,
            mainImageUrl: formData.mainImageUrl,
            mainImageAlt: formData.mainImageAlt,
            mainImageCaption: formData.mainImageCaption,
            author: formData.author,
            authorLink: formData.authorLink,
            introText: formData.introText,
            tags: formData.tags
        };

        // Générer le HTML à partir du contenu structuré pour le stocker dans generatedHtml
        const generatedHtml = formData.structuredContent
            ? generateRawContentFromSections(formData.structuredContent, postDataForHTML)
            : formData.content || '';

        // Extraire uniquement la partie <article> pour le champ generatedArticleHtml
        const generatedArticleHtml = extractArticleContent(generatedHtml);

        // Générer le JSON-LD pour les métadonnées structurées
        const jsonLdData = {
            ...postDataForHTML,
            title: formData.title,
            mainImageUrl: formData.mainImageUrl,
            createdAt: new Date().toISOString(),
            publishDate: formData.publishDate
        };
        const jsonLd = generateJsonLd(jsonLdData);

        console.log('Content to save (start):', content.substring(0, 200) + '...');
        console.log('Length of the content JSON:', content.length);
        console.log('Generated HTML to save (start):', generatedHtml.substring(0, 200) + '...');
        console.log('Generated Article HTML to save (start):', generatedArticleHtml.substring(0, 200) + '...');
        console.log('Generated JSON-LD:', jsonLd);

        // Prepare minimal data needed for post creation
        const postData = {
            title: formData.title,
            slug: formData.slug,
            metaDescription: formData.excerpt,
            metaKeywords: [],
            excerpt: formData.introText,
            mainImageUrl: formData.mainImageUrl,
            mainImageAlt: formData.mainImageAlt,
            mainImageCaption: formData.mainImageCaption,
            content,
            generatedHtml, // HTML complet généré
            generatedArticleHtml, // Uniquement la partie <article>
            jsonLd, // JSON-LD généré
            status, // Use the enum value
            categoryId: category.id,
            author: formData.author,
            authorLink: formData.authorLink,
        }

        console.log('Prepared post data:', postData)

        // Create the post
        const post = await prisma.seoPost.create({
            data: postData
        })

        // Si nous avons des tags, les ajouter via la relation
        if (parsedTags.length > 0) {
            // Créer ou connecter chaque tag pour ce post
            await Promise.all(parsedTags.map(async (tagName) => {
                // D'abord créer ou récupérer le tag
                const tag = await prisma.seoTag.upsert({
                    where: { name: tagName },
                    update: {},
                    create: {
                        name: tagName,
                        slug: tagName.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-')
                    }
                });

                // Ensuite créer la relation
                await prisma.seoPostTag.create({
                    data: {
                        postId: post.id,
                        tagId: tag.id
                    }
                });
            }));

            // Stocker également la liste des tags sous forme de chaîne dans la table SeoPost
            const tagsString = parsedTags.join(',');
            await prisma.$executeRaw`UPDATE "backoffice"."SeoPost" SET "tags" = ${tagsString} WHERE "id" = ${post.id}`;
        }

        console.log('Post created successfully:', post.id)

        revalidatePath('/blog-posts')

        return { success: true, post, postId: post.id }
    } catch (error) {
        console.error('Failed to create blog post:', error)
        if (error instanceof Error) {
            console.error('Error details:', error.message, error.stack)
        }
        return { error: 'Failed to create blog post' }
    }
}

export async function getBlogPost(id: number) {
    try {

        const post = await prisma.seoPost.findUnique({
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

        if (!post) {
            return { error: 'Article not found' }
        }

        // Récupérer les noms des tags et les joindre en une chaîne
        const tagNames = post.tags.map(postTag => postTag.tag.name);
        const tagsString = tagNames.join(',');

        // Décoder le contenu structuré s'il existe
        const { rawContent, structuredContent } = decodeStructuredContent(post.content)

        /*
        console.log('getBlogPost - Contenu décodé:');
        console.log('- HTML brut (début):', rawContent.substring(0, 500) + '...');
        console.log('- JSON structuré disponible:', !!structuredContent);
        console.log('- HTML généré stocké (début):', post.generatedHtml?.substring(0, 500) + '...');
        console.log('- Article HTML généré stocké (début):', post.generatedArticleHtml?.substring(0, 500) + '...');
        console.log('- Tags récupérés:', post.tags);
        console.log('- JSON-LD récupéré:', post.jsonLd);
        */

        if (structuredContent) {
            console.log('- Structure JSON (aperçu):',
                JSON.stringify(structuredContent).substring(0, 500) + '...'
            );
        }

        // Pour l'édition, on retourne simplement le contenu original pour que l'éditeur puisse le reconstituer
        // Si c'est du contenu structuré, on renvoie le JSON structuré
        // Sinon, on renvoie le contenu brut
        return {
            success: true,
            post: {
                ...post,
                // Lors de l'édition, le contenu brut est généré à la volée par l'éditeur
                content: structuredContent ? rawContent : post.content,
                // On transmet directement la structure JSON pour l'éditeur
                structuredContent,
                // On transmet également le HTML généré stocké
                generatedHtml: post.generatedHtml || rawContent,
                // On transmet également le HTML de l'article uniquement
                generatedArticleHtml: post.generatedArticleHtml || extractArticleContent(post.generatedHtml || rawContent),
                // On ajoute la chaîne de tags
                tags: tagsString
            }
        }
    } catch (error) {
        console.error('Error when retrieving the article:', error)
        return { error: 'Error when retrieving the article' }
    }
}

export async function updateBlogPost(id: number, formData: BlogPostFormValues) {
    try {

        // Log détaillé des données reçues
        console.log('updateBlogPost - Données reçues:');
        console.log('- titre:', formData.title);
        console.log('- structuredContent disponible:', !!formData.structuredContent);

        if (formData.structuredContent) {
            console.log('- structuredContent aperçu:',
                JSON.stringify(formData.structuredContent).substring(0, 200) + '...');

            // Vérifier spécifiquement les valeurs de h3
            const h3Elements: Array<{ id: string, content: string }> = [];
            if (Array.isArray(formData.structuredContent)) {
                formData.structuredContent.forEach(section => {
                    if (section.elements) {
                        section.elements.forEach(element => {
                            if (element.type === 'h3') {
                                h3Elements.push({
                                    id: element.id,
                                    content: element.content
                                });
                            }
                        });
                    }
                });
            }
            console.log('- h3 elements trouvés:', h3Elements);
        }

        // Find the category ID or create a new one
        const category = await prisma.seoCategory.upsert({
            where: { name: formData.category },
            update: {},
            create: {
                name: formData.category,
                shortDescription: `Category for ${formData.category} posts`,
            },
        })

        // Parse tags
        let parsedTags: string[] = []
        try {
            if (formData.tags) {
                if (formData.tags.startsWith('[')) {
                    // Try parsing as JSON
                    parsedTags = JSON.parse(formData.tags)
                } else {
                    // Parse as comma-separated string
                    parsedTags = formData.tags.split(',').map(tag => tag.trim()).filter(Boolean)
                }
            }
        } catch (error) {
            console.error('Error when parsing tags:', error)
            parsedTags = []
        }

        // Set the proper status as an enum value
        const status: PostStatus = formData.status === 'published' ? PostStatus.PUBLISHED : PostStatus.DRAFT

        // Stocker uniquement le JSON structuré dans le champ content
        // Si structuredContent n'existe pas, on stocke le contenu brut comme fallback
        const content = formData.structuredContent
            ? JSON.stringify(formData.structuredContent)
            : formData.content;

        // Préparer les données complètes du post pour générer le HTML
        const postDataForHTML = {
            title: formData.title,
            metaDescription: formData.excerpt,
            excerpt: formData.introText,
            mainImageUrl: formData.mainImageUrl,
            mainImageAlt: formData.mainImageAlt,
            mainImageCaption: formData.mainImageCaption,
            author: formData.author,
            authorLink: formData.authorLink,
            introText: formData.introText,
            tags: formData.tags
        };

        // Générer le HTML à partir du contenu structuré pour le stocker dans generatedHtml
        const generatedHtml = formData.structuredContent
            ? generateRawContentFromSections(formData.structuredContent, postDataForHTML)
            : formData.content || '';

        // Extraire uniquement la partie <article> pour le champ generatedArticleHtml
        const generatedArticleHtml = extractArticleContent(generatedHtml);

        // Récupérer l'article existant pour obtenir la date de création
        const existingPost = await prisma.seoPost.findUnique({
            where: { id }
        });

        // Générer le JSON-LD pour les métadonnées structurées
        const jsonLdData = {
            ...postDataForHTML,
            title: formData.title,
            mainImageUrl: formData.mainImageUrl,
            createdAt: existingPost?.createdAt?.toISOString() || new Date().toISOString(),
            publishDate: formData.publishDate
        };
        const jsonLd = generateJsonLd(jsonLdData);

        console.log('Content to save (start):', content.substring(0, 200) + '...');
        console.log('Generated HTML to save (start):', generatedHtml.substring(0, 200) + '...');
        console.log('Generated Article HTML to save (start):', generatedArticleHtml.substring(0, 200) + '...');
        console.log('Generated JSON-LD:', jsonLd);

        // Prepare data for update
        const postData = {
            title: formData.title,
            slug: formData.slug,
            metaDescription: formData.excerpt,
            metaKeywords: [],
            excerpt: formData.introText,
            mainImageUrl: formData.mainImageUrl,
            mainImageAlt: formData.mainImageAlt,
            mainImageCaption: formData.mainImageCaption,
            content,
            generatedHtml, // HTML complet généré
            generatedArticleHtml, // Uniquement la partie <article>
            jsonLd, // JSON-LD généré
            status,
            category: {
                connect: { id: category.id }
            },
            author: formData.author,
            authorLink: formData.authorLink,
        }

        // Update the post
        const post = await prisma.seoPost.update({
            where: { id },
            data: postData
        })

        // Mettre à jour les tags séparément
        // Récupérer d'abord tous les tags existants pour ce post
        const existingPostTags = await prisma.seoPostTag.findMany({
            where: {
                postId: id
            },
            include: {
                tag: true
            }
        });

        // Extraire les noms des tags existants
        const existingTagNames = existingPostTags.map(pt => pt.tag.name);

        // Identifier les tags à ajouter (tags présents dans parsedTags mais pas dans existingTagNames)
        const tagsToAdd = parsedTags.filter(tagName => !existingTagNames.includes(tagName));

        // Identifier les tags à supprimer (tags présents dans existingTagNames mais pas dans parsedTags)
        const tagsToRemove = existingPostTags.filter(pt => !parsedTags.includes(pt.tag.name));

        // Ajouter les nouveaux tags
        if (tagsToAdd.length > 0) {
            await Promise.all(tagsToAdd.map(async (tagName) => {
                // D'abord créer ou récupérer le tag
                const tag = await prisma.seoTag.upsert({
                    where: { name: tagName },
                    update: {},
                    create: {
                        name: tagName,
                        slug: tagName.toLowerCase().replace(/[^\w\s]/gi, '').replace(/\s+/g, '-')
                    }
                });

                // Ensuite créer la relation
                await prisma.seoPostTag.create({
                    data: {
                        postId: id,
                        tagId: tag.id
                    }
                });
            }));
        }

        // Supprimer les relations pour les tags qui ne sont plus présents
        if (tagsToRemove.length > 0) {
            await Promise.all(tagsToRemove.map(async (postTag) => {
                await prisma.seoPostTag.delete({
                    where: {
                        postId_tagId: {
                            postId: id,
                            tagId: postTag.tag.id
                        }
                    }
                });
            }));
        }

        // Mettre à jour le champ tags dans le post lui-même pour la compatibilité
        // Le schéma Prisma indique que tags est une relation, mais il semble y avoir 
        // un besoin de stocker la liste des tags sous forme de chaîne également.
        // Nous pouvons utiliser la méthode executeRaw pour mettre à jour ce champ directement.

        // Convertir la liste de tags en chaîne
        const tagsString = parsedTags.join(',');

        // Mettre à jour le champ tags dans la table SeoPost
        await prisma.$executeRaw`UPDATE "backoffice"."SeoPost" SET "tags" = ${tagsString} WHERE "id" = ${id}`;

        console.log('Article mis à jour avec succès:', post.id);
        revalidatePath('/blog-posts')

        return { success: true, post, postId: post.id }
    } catch (error) {
        console.error('Error when updating the article:', error)
        if (error instanceof Error) {
            console.error('Error details:', error.message, error.stack)
        }
        return { error: 'Error when updating the article' }
    }
} 