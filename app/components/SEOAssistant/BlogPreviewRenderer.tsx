'use client'

import { BlogContent, ElementType } from '../BlogEditor/types'
import { FormData } from './htmlGenerator'
import styles from '../SeoGuide/SeoGuideModal.module.scss'

interface BlogPreviewRendererProps {
  formData: FormData
}

export default function BlogPreviewRenderer({ formData }: BlogPreviewRendererProps) {
  const {
    title = 'Titre de l\'article',
    excerpt = '',
    author = 'Auteur',
    authorLink = '',
    creationDate = new Date(),
    mainImageUrl = '',
    mainImageAlt = '',
    mainImageCaption = '',
    blogContent = [],
    tags = []
  } = formData

  const formatDateReadable = (date: Date) => {
    return date.toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const renderBlogContent = (content: BlogContent) => {
    return content.map((section, sectionIndex) => (
      <div key={section.id || sectionIndex} className={styles.previewSection}>
        {section.elements.map((element, elementIndex) => {
          switch (element.type) {
            case ElementType.H2:
              return (
                <h2 key={element.id || elementIndex} className={styles.previewH2}>
                  {element.content || 'Titre H2'}
                </h2>
              )
            case ElementType.H3:
              return (
                <h3 key={element.id || elementIndex} className={styles.previewH3}>
                  {element.content || 'Titre H3'}
                </h3>
              )
            case ElementType.PARAGRAPH:
              return (
                <p key={element.id || elementIndex} className={styles.previewParagraph}>
                  {element.content || 'Contenu du paragraphe...'}
                </p>
              )
            case ElementType.IMAGE:
              if (element.url) {
                return (
                  <div key={element.id || elementIndex}>
                    <img 
                      src={element.url} 
                      alt={element.alt || 'Image'} 
                      className={styles.previewImage}
                      onError={(e) => {
                        e.currentTarget.src = "https://via.placeholder.com/600x400";
                      }}
                    />
                    {element.caption && (
                      <p className={styles.previewFigCaption}>{element.caption}</p>
                    )}
                  </div>
                )
              }
              return null
            case ElementType.VIDEO:
              if (element.url) {
                return (
                  <div key={element.id || elementIndex} className={styles.previewSection}>
                    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                      <iframe 
                        src={element.url}
                        style={{ 
                          position: 'absolute', 
                          top: 0, 
                          left: 0, 
                          width: '100%', 
                          height: '100%' 
                        }}
                        frameBorder="0"
                        allowFullScreen
                      />
                    </div>
                    {element.caption && (
                      <p className={styles.previewFigCaption}>{element.caption}</p>
                    )}
                  </div>
                )
              }
              return null
            case ElementType.LIST:
              if (element.items && element.items.length > 0) {
                return (
                  <ul key={element.id || elementIndex} className={styles.previewList}>
                    {element.items.map((item, itemIndex) => (
                      <li key={itemIndex} className={styles.previewListItem}>
                        {item}
                      </li>
                    ))}
                  </ul>
                )
              }
              return null
            case ElementType.ACCORDION:
              if (element.items && element.items.length > 0) {
                return (
                  <div key={element.id || elementIndex} className={styles.previewSection}>
                    {element.title && (
                      <h3 className={styles.previewH3}>{element.title}</h3>
                    )}
                    {element.items.map((item, itemIndex) => (
                      <div key={item.id || `accordion-item-${elementIndex}-${itemIndex}`} className={styles.previewAccordion}>
                        <div className={styles.previewAccordionHeader}>
                          {item.title || 'Titre non défini'}
                          <span>▼</span>
                        </div>
                        <div className={styles.previewAccordionContent}>
                          <p>{item.content || 'Contenu non défini'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              } else {
                return (
                  <div key={element.id || elementIndex} className={styles.previewSection}>
                    {element.title && (
                      <h3 className={styles.previewH3}>{element.title}</h3>
                    )}
                    <div className={styles.previewAccordion}>
                      <div className={styles.previewAccordionHeader}>
                        Accordion vide
                        <span>▼</span>
                      </div>
                      <div className={styles.previewAccordionContent}>
                        <p style={{ fontStyle: 'italic', color: '#9ca3af' }}>Aucun élément ajouté à cet accordion</p>
                      </div>
                    </div>
                  </div>
                )
              }
            default:
              return null
          }
        })}
      </div>
    ))
  }

  return (
    <div className={styles.previewContainer}>
      <h1 className={styles.previewTitle}>{title}</h1>
      
      <div className={styles.previewMeta}>
        <div className={styles.previewAuthor}>
          <span>
            Par {authorLink ? (
              <a href={authorLink} target="_blank" rel="noopener noreferrer">{author}</a>
            ) : (
              author
            )} • {formatDateReadable(creationDate)}
          </span>
        </div>
        <span>Temps de lecture: 5 min</span>
      </div>
      
      <div className={styles.previewContent}>
        {mainImageUrl && (
          <>
            <img 
              src={mainImageUrl}
              alt={mainImageAlt || 'Image principale'} 
              className={styles.previewImage}
              onError={(e) => {
                e.currentTarget.src = "https://via.placeholder.com/800x500";
              }}
            />
            {mainImageCaption && (
              <p className={styles.previewFigCaption}>{mainImageCaption}</p>
            )}
          </>
        )}
        
        {excerpt && (
          <p className={styles.previewParagraph} style={{ fontStyle: 'italic', marginBottom: '2rem' }}>
            {excerpt}
          </p>
        )}
        
        {renderBlogContent(blogContent)}
        
        {tags && tags.length > 0 && (
          <div style={{ 
            marginTop: '2rem', 
            paddingTop: '1.5rem', 
            borderTop: '1px solid #e5e7eb' 
          }}>
            <h3 style={{ 
              margin: '0 0 1rem 0', 
              fontSize: '1.125rem', 
              fontWeight: '600', 
              color: '#374151' 
            }}>
              Tags
            </h3>
            <div style={{ 
              display: 'flex', 
              flexWrap: 'wrap', 
              gap: '0.5rem' 
            }}>
              {tags.map((tag, index) => (
                <span
                  key={index}
                  style={{
                    display: 'inline-block',
                    padding: '0.25rem 0.75rem',
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    borderRadius: '9999px',
                    border: '1px solid #d1d5db'
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {blogContent.length === 0 && (
          <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
            <p>Aucun contenu n'a encore été ajouté à l'article.</p>
            <p>Commencez par remplir les champs du formulaire pour voir la prévisualisation.</p>
          </div>
        )}
      </div>
    </div>
  )
} 