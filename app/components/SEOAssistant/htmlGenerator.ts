import { BlogContent, BlogSection, ElementType, ImageElement, VideoElement, ListElement, OrderedListElement, AccordionElement, H2Element, H3Element, ParagraphElement } from '../BlogEditor/types'

export interface FormData {
  title?: string
  metaDescription?: string
  metaKeywords?: string
  tags?: string[]
  slug?: string
  excerpt?: string
  author?: string
  authorLink?: string
  creationDate?: Date
  mainImageUrl?: string
  mainImageAlt?: string
  mainImageCaption?: string
  content?: string
  blogContent?: BlogContent
}

export function generateSEOHTML(formData: FormData): string {
  const {
    title = '',
    metaDescription = '',
    metaKeywords = '',
    tags = [],
    slug = '',
    excerpt = '',
    author = '',
    authorLink = '',
    creationDate = new Date(),
    mainImageUrl = '',
    mainImageAlt = '',
    mainImageCaption = '',
    blogContent = []
  } = formData

  const keywords = metaKeywords.split(',').map(k => k.trim()).filter(k => k.length > 0)
  const keywordsString = keywords.join(', ')

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0]
  }

  const formatDateReadable = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const generateBlogContentHTML = (content: BlogContent): string => {
    return content.map(section => {
      const sectionHTML = section.elements.map(element => {
        switch (element.type) {
          case ElementType.H2:
            const h2Element = element as H2Element
            return `        <h2>${h2Element.content || ''}</h2>`
          case ElementType.H3:
            const h3Element = element as H3Element
            return `        <h3>${h3Element.content || ''}</h3>`
          case ElementType.PARAGRAPH:
            const pElement = element as ParagraphElement
            if (pElement.richContent && pElement.richContent.segments.length > 0) {
              const formattedContent = pElement.richContent.segments.map(segment => {
                let text = segment.isLink
                  ? `<a href="${segment.linkUrl || ''}">${segment.linkText || segment.text}</a>`
                  : segment.text

                if (segment.isBold) text = `<b>${text}</b>`
                if (segment.isItalic) text = `<i>${text}</i>`
                if (segment.isUnderline) text = `<u>${text}</u>`

                return text
              }).join('')
              return `        <p>${formattedContent}</p>`
            }
            return `        <p>${pElement.content || ''}</p>`
          case ElementType.IMAGE:
            const imgElement = element as ImageElement
            if (imgElement.url) {
              return `        <figure>
          <img src="${imgElement.url}" alt="${imgElement.alt || ''}" width="600" height="400">
          ${imgElement.caption ? `<figcaption>${imgElement.caption}</figcaption>` : ''}
        </figure>`
            }
            return ''
          case ElementType.VIDEO:
            const videoElement = element as VideoElement
            if (videoElement.url) {
              return `        <div class="video-container">
          <iframe src="${videoElement.url}" frameborder="0" allowfullscreen></iframe>
          ${videoElement.caption ? `<p class="video-caption">${videoElement.caption}</p>` : ''}
        </div>`
            }
            return ''
          case ElementType.LIST:
            const listElement = element as ListElement
            if (listElement.items && listElement.items.length > 0) {
              const listItems = listElement.items.map(item => `          <li>${item}</li>`).join('\n')
              return `        <ul>
${listItems}
        </ul>`
            }
            return ''
          case ElementType.ORDERED_LIST:
            const orderedListElement = element as OrderedListElement
            if (orderedListElement.items && orderedListElement.items.length > 0) {
              const listItems = orderedListElement.items.map(item => `          <li>${item}</li>`).join('\n')
              return `        <ol>
${listItems}
        </ol>`
            }
            return ''
          case ElementType.ACCORDION:
            const accordionElement = element as AccordionElement
            if (accordionElement.items && accordionElement.items.length > 0) {
              const accordionTitle = accordionElement.title ? `        <h2>${accordionElement.title}</h2>` : ''
              const accordionItems = accordionElement.items.map(item =>
                `          <div class="accordion-item">
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

      if (sectionHTML) {
        return `      <section>
${sectionHTML}
      </section>`
      }
      return ''
    }).filter(html => html.length > 0).join('\n\n')
  }

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Balises SEO essentielles -->
  <title>${title}${title ? ' | ' : ''}Nom de Marque</title>
  <meta name="description" content="${metaDescription}">
  ${keywordsString ? `<meta name="keywords" content="${keywordsString}">` : ''}
  
  <!-- Balises Open Graph pour les partages sur réseaux sociaux -->
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${metaDescription}">
  ${mainImageUrl ? `<meta property="og:image" content="${mainImageUrl}">` : ''}
  <meta property="og:url" content="https://example.com/${slug}">
  <meta property="og:type" content="article">
  
  <!-- Balises Twitter Card -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${metaDescription}">
  ${mainImageUrl ? `<meta name="twitter:image" content="${mainImageUrl}">` : ''}
  
  <!-- Autres balises méta importantes -->
  ${author ? `<meta name="author" content="${author}">` : ''}
  <link rel="canonical" href="https://example.com/${slug}">
  
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
    <!-- Logo et navigation avec des liens textuels descriptifs -->
  </header>
  
  <main>
    <article>
      <!-- Structure hiérarchique correcte des titres -->
      <h1>${title}</h1>
      
      <!-- Métadonnées de l'article -->
      <div class="meta">
        ${author ? `<span class="author">Par ${authorLink ? `<a href="${authorLink}">` : ''}${author}${authorLink ? '</a>' : ''}</span>` : ''}
        <time datetime="${formatDate(creationDate)}">${formatDateReadable(creationDate)}</time>
        <span class="read-time">Temps de lecture: 5 min</span>
      </div>
      
      ${mainImageUrl ? `<!-- Image principale avec attributs alt pertinents -->
      <figure>
        <img src="${mainImageUrl}" alt="${mainImageAlt}" width="800" height="500">
        ${mainImageCaption ? `<figcaption>${mainImageCaption}</figcaption>` : ''}
      </figure>` : ''}
      
      ${excerpt ? `<!-- Introduction avec mots-clés principaux dans les premiers paragraphes -->
      <p class="excerpt">${excerpt}</p>` : ''}
      
      <!-- Corps de l'article bien structuré -->
${generateBlogContentHTML(blogContent)}

      ${tags && tags.length > 0 ? `<!-- Section des tags -->
      <div class="tags-section">
        <h3>Tags</h3>
        <div class="tags-list">
          ${tags.map(tag => `<span class="tag-badge">${tag}</span>`).join('\n          ')}
        </div>
      </div>` : ''}
    </article>
  </main>
  
  <footer>
    <!-- Pied de page avec liens de navigation et informations de copyright -->
  </footer>
</body>
</html>`
} 