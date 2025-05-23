import { BlogContent, BlogSection, ElementType } from '@/app/components/BlogEditor/types'

export interface SeoPostData {
    title: string
    metaDescription: string
    author: string
    authorLink?: string
    mainImageUrl?: string
    mainImageAlt?: string
    mainImageCaption?: string
    creationDate: Date
    excerpt?: string
    blogContent: BlogContent
    tags?: string[]
}

/**
 * Valide et nettoie une URL d'image
 */
function validateImageUrl(url?: string): string {
    if (!url) return ''

    // Nettoyer l'URL en supprimant les doubles slashes (sauf après le protocole)
    const cleanUrl = url.replace(/([^:]\/)\/+/g, '$1')

    // Vérifier que l'URL est valide
    try {
        new URL(cleanUrl)
        return cleanUrl
    } catch (error) {
        console.warn('URL d\'image invalide:', url)
        return ''
    }
}

/**
 * Génère le JSON-LD pour un article SEO
 */
export function generateSeoJsonLd(postData: SeoPostData): string {
    const logoUrl = 'http://localhost:3000/_next/image?url=%2Fimages%2Flogos%2Fretro%2FRetro_logo_1.png&w=256&q=75'

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        "headline": postData.title,
        "image": validateImageUrl(postData.mainImageUrl),
        "datePublished": postData.creationDate.toISOString().split('T')[0],
        "dateModified": new Date().toISOString(),
        "author": {
            "@type": "Person",
            "name": postData.author,
            ...(postData.authorLink && { "url": postData.authorLink })
        },
        "publisher": {
            "@type": "Organization",
            "name": "InRealArt",
            "logo": {
                "@type": "ImageObject",
                "url": logoUrl
            }
        },
        "description": postData.metaDescription || postData.excerpt || ""
    }

    return JSON.stringify(jsonLd, null, 2)
}

/**
 * Génère le HTML complet pour un article SEO
 */
export function generateSeoHtml(postData: SeoPostData): string {
    const articleHtml = generateArticleHtml(postData)

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const cleanMainImageUrl = validateImageUrl(postData.mainImageUrl)

    return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${postData.title} | InRealArt</title>
  <meta name="description" content="${postData.metaDescription}">
  <meta property="og:title" content="${postData.title}">
  <meta property="og:description" content="${postData.metaDescription}">
  ${cleanMainImageUrl ? `<meta property="og:image" content="${cleanMainImageUrl}">` : ''}
  <meta property="og:type" content="article">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${postData.title}">
  <meta name="twitter:description" content="${postData.metaDescription}">
  ${cleanMainImageUrl ? `<meta name="twitter:image" content="${cleanMainImageUrl}">` : ''}
  ${postData.author ? `<meta name="author" content="${postData.author}">` : ''}
  <style>
    .tags-section {
      margin-top: 2rem;
      padding-top: 1.5rem;
      border-top: 1px solid #e5e7eb;
    }
    .tags-section h3 {
      margin: 0 0 1rem 0;
      font-size: 1.125rem;
      font-weight: 600;
      color: #374151;
    }
    .tags-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
    }
    .tag-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      background-color: #f3f4f6;
      color: #374151;
      font-size: 0.875rem;
      font-weight: 500;
      border-radius: 9999px;
      border: 1px solid #d1d5db;
      text-decoration: none;
      transition: background-color 0.2s ease;
    }
    .tag-badge:hover {
      background-color: #e5e7eb;
    }
  </style>
</head>
<body>
  <header>
    <nav>
      <!-- Navigation -->
    </nav>
  </header>
  
  <main>
    ${articleHtml}
  </main>
  
  <footer>
    <!-- Footer -->
  </footer>
</body>
</html>`
}

/**
 * Génère uniquement le HTML de la balise <article>
 */
export function generateArticleHtml(postData: SeoPostData): string {
    const formatDate = (date: Date) => {
        return date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }

    const formatDatetime = (date: Date) => {
        return date.toISOString().split('T')[0]
    }

    const generateBlogContentHtml = (content: BlogContent): string => {
        return content.map(section => {
            const sectionHtml = section.elements.map(element => {
                switch (element.type) {
                    case ElementType.H2:
                        return `      <h2>${element.content || ''}</h2>`
                    case ElementType.H3:
                        return `      <h3>${element.content || ''}</h3>`
                    case ElementType.PARAGRAPH:
                        return `      <p>${element.content || ''}</p>`
                    case ElementType.IMAGE:
                        if (element.url) {
                            const cleanImageUrl = validateImageUrl(element.url)
                            if (cleanImageUrl) {
                                return `      <figure>
        <img src="${cleanImageUrl}" alt="${element.alt || ''}" width="600" height="400">
        ${element.caption ? `<figcaption>${element.caption}</figcaption>` : ''}
      </figure>`
                            }
                        }
                        return ''
                    case ElementType.VIDEO:
                        if (element.url) {
                            return `      <div class="video-container">
        <iframe src="${element.url}" frameborder="0" allowfullscreen></iframe>
        ${element.caption ? `<p class="video-caption">${element.caption}</p>` : ''}
      </div>`
                        }
                        return ''
                    case ElementType.LIST:
                        if (element.items && element.items.length > 0) {
                            const listItems = element.items.map(item => `        <li>${item}</li>`).join('\n')
                            return `      <ul>
${listItems}
      </ul>`
                        }
                        return ''
                    case ElementType.ACCORDION:
                        if (element.items && element.items.length > 0) {
                            const accordionTitle = element.title ? `      <h2>${element.title}</h2>` : ''
                            const accordionItems = element.items.map(item =>
                                `        <div class="accordion-item">
          <h3 class="accordion-header">${item.title}</h3>
          <div class="accordion-content">
            <p>${item.content}</p>
          </div>
        </div>`
                            ).join('\n')

                            return `${accordionTitle}
      <div class="accordion">
${accordionItems}
      </div>`
                        }
                        return ''
                    default:
                        return ''
                }
            }).filter(html => html.length > 0).join('\n')

            if (sectionHtml) {
                return `    <section>
${sectionHtml}
    </section>`
            }
            return ''
        }).filter(html => html.length > 0).join('\n\n')
    }

    return `  <article>
    <header>
      <h1>${postData.title}</h1>
      
      <div class="article-meta">
        ${postData.author ? `<span class="author">Par ${postData.authorLink ? `<a href="${postData.authorLink}">` : ''}${postData.author}${postData.authorLink ? '</a>' : ''}</span>` : ''}
        <time datetime="${formatDatetime(postData.creationDate)}">${formatDate(postData.creationDate)}</time>
      </div>
      
      ${validateImageUrl(postData.mainImageUrl) ? `<figure class="main-image">
        <img src="${validateImageUrl(postData.mainImageUrl)}" alt="${postData.mainImageAlt || ''}" width="800" height="500">
        ${postData.mainImageCaption ? `<figcaption>${postData.mainImageCaption}</figcaption>` : ''}
      </figure>` : ''}
    </header>
    
    ${postData.excerpt ? `<div class="introduction">
      <p>${postData.excerpt}</p>
    </div>` : ''}
    
    <div class="content">
${generateBlogContentHtml(postData.blogContent)}
    </div>
    
    ${postData.tags && postData.tags.length > 0 ? `<div class="tags-section">
      <h3>Tags</h3>
      <div class="tags-list">
        ${postData.tags.map(tag => `<span class="tag-badge">${tag}</span>`).join('\n        ')}
      </div>
    </div>` : ''}
  </article>`
} 