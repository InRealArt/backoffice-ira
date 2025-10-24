'use client'

import { BlogContent, ElementType } from '../BlogEditor/types'
import { FormData } from './htmlGenerator'
import RichContentRenderer from '../BlogEditor/RichContentRenderer'
import { calculateReadingTimeFromBlogContent } from '@/lib/utils/reading-time-calculator'

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
      <div key={section.id || sectionIndex} className="mb-8">
        {section.elements.map((element, elementIndex) => {
          switch (element.type) {
            case ElementType.H2:
              return (
                <h2 key={element.id || elementIndex} className="text-2xl font-bold text-gray-900 mb-4 mt-8 first:mt-0">
                  {element.content || 'Titre H2'}
                </h2>
              )
            case ElementType.H3:
              return (
                <h3 key={element.id || elementIndex} className="text-xl font-semibold text-gray-800 mb-3 mt-6">
                  {element.content || 'Titre H3'}
                </h3>
              )
            case ElementType.PARAGRAPH:
              return (
                <p key={element.id || elementIndex} className="text-gray-700 leading-relaxed mb-4">
                  <RichContentRenderer 
                    content={element.content || 'Contenu du paragraphe...'}
                    richContent={element.richContent}
                  />
                </p>
              )
            case ElementType.IMAGE:
              if (element.url) {
                return (
                  <div key={element.id || elementIndex}>
                    <img 
                      src={element.url} 
                      alt={element.alt || 'Image'} 
                      className="w-full h-auto rounded-lg shadow-md mb-2"
                      onError={(e) => {
                        e.currentTarget.src = "";
                      }}
                    />
                    {element.caption && (
                      <p className="text-sm text-gray-600 italic text-center">{element.caption}</p>
                    )}
                  </div>
                )
              }
              return null
            case ElementType.VIDEO:
              if (element.url) {
                return (
                  <div key={element.id || elementIndex} className="mb-8">
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
                      <p className="text-sm text-gray-600 italic text-center">{element.caption}</p>
                    )}
                  </div>
                )
              }
              return null
            case ElementType.LIST:
              if (element.items && element.items.length > 0) {
                return (
                  <ul key={element.id || elementIndex} className="list-disc list-inside space-y-2 mb-4" data-list-type="unordered">
                    {element.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="text-gray-700">
                        {item}
                      </li>
                    ))}
                  </ul>
                )
              }
              return null
            case ElementType.ORDERED_LIST:
              if (element.items && element.items.length > 0) {
                return (
                  <ol key={element.id || elementIndex} className="list-decimal list-inside space-y-2 mb-4" data-list-type="ordered">
                    {element.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="text-gray-700">
                        {item}
                      </li>
                    ))}
                  </ol>
                )
              }
              return null
            case ElementType.ACCORDION:
              if (element.items && element.items.length > 0) {
                return (
                  <div key={element.id || elementIndex} className="mb-8">
                    {element.title && (
                      <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">{element.title}</h3>
                    )}
                    {element.items.map((item, itemIndex) => (
                      <div key={item.id || `accordion-item-${elementIndex}-${itemIndex}`} className="border border-gray-200 rounded-lg mb-2">
                        <div className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer">
                          <span className="font-medium text-gray-800">{item.title || 'Titre non défini'}</span>
                          <span className="text-gray-500">▼</span>
                        </div>
                        <div className="p-4 bg-white">
                          <p className="text-gray-700">{item.content || 'Contenu non défini'}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              } else {
                return (
                  <div key={element.id || elementIndex} className="mb-8">
                    {element.title && (
                      <h3 className="text-xl font-semibold text-gray-800 mb-3 mt-6">{element.title}</h3>
                    )}
                    <div className="border border-gray-200 rounded-lg mb-2">
                      <div className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer">
                        <span className="font-medium text-gray-800">Accordion vide</span>
                        <span className="text-gray-500">▼</span>
                      </div>
                      <div className="p-4 bg-white">
                        <p className="italic text-gray-400">Aucun élément ajouté à cet accordion</p>
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
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <h1 className="text-4xl font-bold text-gray-900 mb-6">{title}</h1>
      
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-8 pb-4 border-b border-gray-200">
        <div className="mb-2 sm:mb-0">
          <span className="text-gray-600">
            Par {authorLink ? (
              <a href={authorLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{author}</a>
            ) : (
              author
            )} • {formatDateReadable(creationDate)}
          </span>
        </div>
        <span className="text-sm text-gray-500">Temps de lecture: {calculateReadingTimeFromBlogContent(JSON.stringify(blogContent))} min</span>
      </div>
      
      <div className="prose prose-lg max-w-none">
        {mainImageUrl && (
          <>
            <img 
              src={mainImageUrl}
              alt={mainImageAlt || 'Image principale'} 
              className="w-full h-auto rounded-lg shadow-lg mb-4"
              onError={(e) => {
                e.currentTarget.src = "";
              }}
            />
            {mainImageCaption && (
              <p className="text-sm text-gray-600 italic text-center mb-6">{mainImageCaption}</p>
            )}
          </>
        )}
        
        {excerpt && (
          <p className="text-gray-700 leading-relaxed mb-8 italic text-lg">
            {excerpt}
          </p>
        )}
        
        {renderBlogContent(blogContent)}
        
        {tags && tags.length > 0 && (
          <div className="mt-8 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-block px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full border border-gray-300"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {blogContent.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <p>Aucun contenu n&apos;a encore été ajouté à l&apos;article.</p>
            <p>Commencez par remplir les champs du formulaire pour voir la prévisualisation.</p>
          </div>
        )}
      </div>
    </div>
  )
} 