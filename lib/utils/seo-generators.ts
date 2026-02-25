import { BlogContent, BlogSection, ElementType, RelatedArticleItem } from '@/app/components/BlogEditor/types'

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
  estimatedReadTime?: number // Temps de lecture en minutes
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
    .related-articles-section {
      margin-top: 3rem;
      padding-top: 2rem;
      border-top: 2px solid #e5e7eb;
    }
    .related-articles-section h3 {
      margin: 0 0 1.5rem 0;
      font-size: 1.25rem;
      font-weight: 700;
      color: #111827;
    }
    .related-articles-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.25rem;
    }
    .related-article-card {
      display: flex;
      flex-direction: column;
      border: 1px solid #e5e7eb;
      border-radius: 12px;
      overflow: hidden;
      text-decoration: none;
      color: inherit;
      transition: box-shadow 0.2s ease, transform 0.2s ease;
      background: #ffffff;
    }
    .related-article-card:hover {
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }
    .related-article-card-image {
      width: 100%;
      height: 160px;
      object-fit: cover;
      background: #f3f4f6;
    }
    .related-article-card-image-placeholder {
      width: 100%;
      height: 160px;
      background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .related-article-card-body {
      padding: 1rem;
      flex: 1;
    }
    .related-article-card-category {
      font-size: 0.75rem;
      font-weight: 600;
      color: #6366f1;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
    }
    .related-article-card-title {
      font-size: 0.9375rem;
      font-weight: 600;
      color: #111827;
      line-height: 1.4;
      margin: 0;
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
            // Tableau importé depuis DOCX : HTML brut sans wrapper <p>
            if (element.content?.startsWith('<table')) {
              return `      ${element.content}`
            }
            // Gérer le contenu riche avec liens hypertextes
            if (element.richContent && element.richContent.segments && element.richContent.segments.length > 0) {
              const formattedContent = element.richContent.segments.map(segment => {
                let text = segment.isLink
                  ? `<a href="${segment.linkUrl || ''}">${segment.linkText || segment.text}</a>`
                  : segment.text

                if (segment.isBold) text = `<b>${text}</b>`
                if (segment.isItalic) text = `<i>${text}</i>`
                if (segment.isUnderline) text = `<u>${text}</u>`

                return text
              }).join('')
              return `      <p>${formattedContent}</p>`
            }
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
          case ElementType.ORDERED_LIST:
            if (element.items && element.items.length > 0) {
              const listItems = element.items.map(item => `        <li>${item}</li>`).join('\n')
              return `      <ol>
${listItems}
      </ol>`
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
          case ElementType.RELATED_ARTICLES:
            if (element.posts && element.posts.length > 0) {
              const cards = element.posts.map(post => {
                const imageHtml = post.mainImageUrl
                  ? `<img class="related-article-card-image" src="${validateImageUrl(post.mainImageUrl) || ''}" alt="${post.title}" loading="lazy">`
                  : `<div class="related-article-card-image-placeholder"></div>`
                return `        <a class="related-article-card" href="/${post.categoryName.toLowerCase()}/${post.slug}">
          ${imageHtml}
          <div class="related-article-card-body">
            <p class="related-article-card-category">${post.categoryName}</p>
            <p class="related-article-card-title">${post.title}</p>
          </div>
        </a>`
              }).join('\n')
              return `      <div class="related-articles-section">
        <h3>Articles liés</h3>
        <div class="related-articles-grid">
${cards}
        </div>
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
        ${postData.estimatedReadTime ? `<span class="read-time">Temps de lecture: ${postData.estimatedReadTime} min</span>` : ''}
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