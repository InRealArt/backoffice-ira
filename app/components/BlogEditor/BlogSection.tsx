'use client'

import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { BlogSection as BlogSectionType, ContentElement, ElementType } from './types'
import { ContentElementComponent } from './ContentElements'
import styles from './BlogSection.module.scss'

interface BlogSectionProps {
  section: BlogSectionType
  onUpdate: (updated: BlogSectionType) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

export default function BlogSection({ 
  section, 
  onUpdate, 
  onDelete, 
  onMoveUp, 
  onMoveDown 
}: BlogSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState(section.title)

  const handleTitleChange = () => {
    if (title.trim() !== section.title) {
      onUpdate({
        ...section,
        title: title.trim()
      })
    }
    setIsEditing(false)
  }

  const handleAddElement = (type: ElementType) => {
    const newElement: ContentElement = createNewElement(type)
    onUpdate({
      ...section,
      elements: [...section.elements, newElement]
    })
  }

  const handleUpdateElement = (index: number, updated: ContentElement) => {
    const newElements = [...section.elements]
    newElements[index] = updated
    onUpdate({
      ...section,
      elements: newElements
    })
  }

  const handleDeleteElement = (index: number) => {
    const newElements = [...section.elements]
    newElements.splice(index, 1)
    onUpdate({
      ...section,
      elements: newElements
    })
  }

  return (
    <div className={styles.sectionContainer}>
      <div className={styles.sectionHeader}>
        {isEditing ? (
          <div className="flex items-center gap-2 w-full">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={handleTitleChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleTitleChange()
                }
              }}
              className="form-input flex-grow"
              autoFocus
            />
            <button 
              type="button" 
              onClick={handleTitleChange}
              className="btn btn-secondary btn-small"
            >
              Valider
            </button>
          </div>
        ) : (
          <h3 onClick={() => setIsEditing(true)}>{section.title}</h3>
        )}
        
        <div className={styles.sectionControls}>
          <button type="button" onClick={onMoveUp} title="Déplacer vers le haut">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M18 15l-6-6-6 6" />
            </svg>
          </button>
          <button type="button" onClick={onMoveDown} title="Déplacer vers le bas">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M6 9l6 6 6-6" />
            </svg>
          </button>
          <button type="button" onClick={onDelete} title="Supprimer la section">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M3 6h18" />
              <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
            </svg>
          </button>
        </div>
      </div>
      
      <div className={styles.sectionContent}>
        {section.elements.length === 0 ? (
          <div className={styles.emptySection}>
            <p>Aucun élément dans cette section.</p>
            <p>Utilisez les boutons ci-dessous pour ajouter du contenu.</p>
          </div>
        ) : (
          section.elements.map((element, index) => (
            <ContentElementComponent
              key={element.id}
              element={element}
              onUpdate={(updated) => handleUpdateElement(index, updated)}
              onDelete={() => handleDeleteElement(index)}
            />
          ))
        )}
        
        <div className={styles.elementButtons}>
          <button
            type="button"
            onClick={() => handleAddElement(ElementType.H2)}
            className={`${styles.elementButton} ${styles.h2}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M4 12h8" />
              <path d="M4 18V6" />
              <path d="M12 18V6" />
              <path d="M16 12h4" />
            </svg>
            H2
          </button>
          
          <button
            type="button"
            onClick={() => handleAddElement(ElementType.H3)}
            className={`${styles.elementButton} ${styles.h3}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M4 12h8" />
              <path d="M4 18V6" />
              <path d="M12 18V6" />
              <path d="M16 9a4 4 0 014 4 4 4 0 01-4 4h-4" />
            </svg>
            H3
          </button>
          
          <button
            type="button"
            onClick={() => handleAddElement(ElementType.PARAGRAPH)}
            className={`${styles.elementButton} ${styles.paragraph}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M8 6h13" />
              <path d="M8 12h13" />
              <path d="M8 18h13" />
              <path d="M3 6h.01" />
              <path d="M3 12h.01" />
              <path d="M3 18h.01" />
            </svg>
            Paragraphe
          </button>
          
          <button
            type="button"
            onClick={() => handleAddElement(ElementType.IMAGE)}
            className={`${styles.elementButton} ${styles.image}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5-11 11" />
            </svg>
            Image
          </button>
          
          <button
            type="button"
            onClick={() => handleAddElement(ElementType.VIDEO)}
            className={`${styles.elementButton} ${styles.video}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
              <path d="M10 8l6 4-6 4V8z" />
            </svg>
            Vidéo
          </button>
          
          <button
            type="button"
            onClick={() => handleAddElement(ElementType.LIST)}
            className={`${styles.elementButton} ${styles.list}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <line x1="8" y1="6" x2="21" y2="6" />
              <line x1="8" y1="12" x2="21" y2="12" />
              <line x1="8" y1="18" x2="21" y2="18" />
              <line x1="3" y1="6" x2="3.01" y2="6" />
              <line x1="3" y1="12" x2="3.01" y2="12" />
              <line x1="3" y1="18" x2="3.01" y2="18" />
            </svg>
            Liste
          </button>
        </div>
      </div>
    </div>
  )
}

function createNewElement(type: ElementType): ContentElement {
  const id = uuidv4()
  
  switch (type) {
    case ElementType.H2:
      return {
        id,
        type,
        content: ''
      }
    case ElementType.H3:
      return {
        id,
        type,
        content: ''
      }
    case ElementType.PARAGRAPH:
      return {
        id,
        type,
        content: ''
      }
    case ElementType.IMAGE:
      return {
        id,
        type,
        url: '',
        alt: '',
        caption: ''
      }
    case ElementType.VIDEO:
      return {
        id,
        type,
        url: '',
        caption: ''
      }
    case ElementType.LIST:
      return {
        id,
        type,
        items: []
      }
    default:
      throw new Error(`Unknown element type: ${type}`)
  }
} 