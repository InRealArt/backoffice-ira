'use client'

import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { BlogSection as BlogSectionType, ContentElement, ElementType } from './types'
import { ContentElementComponent } from './ContentElements'
import SectionControlButtons from './components/SectionControlButtons'

interface BlogSectionProps {
  section: BlogSectionType
  onUpdate: (updated: BlogSectionType) => void
  onDelete: () => void
  onMoveUp: () => void
  onMoveDown: () => void
  canMoveUp: boolean
  canMoveDown: boolean
}

export default function BlogSection({ 
  section, 
  onUpdate, 
  onDelete, 
  onMoveUp, 
  onMoveDown,
  canMoveUp,
  canMoveDown
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
    <div className="border border-gray-200 rounded-lg mb-4 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 bg-purple-50 border-b border-gray-200">
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
          <h3 onClick={() => setIsEditing(true)} className="text-base font-medium m-0 cursor-pointer">{section.title}</h3>
        )}
        
        <SectionControlButtons
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onDelete={onDelete}
          canMoveUp={canMoveUp}
          canMoveDown={canMoveDown}
        />
      </div>
      
      <div className="p-4 bg-white">
        {section.elements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 bg-gray-50 rounded text-center text-gray-500">
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
        
        <div className="flex flex-wrap gap-2 mt-4">
          <button
            type="button"
            onClick={() => handleAddElement(ElementType.H2)}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 border border-red-200 rounded-full text-sm text-red-700 cursor-pointer transition-colors hover:bg-red-100 hover:border-red-300"
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
            className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-full text-sm text-orange-700 cursor-pointer transition-colors hover:bg-orange-100 hover:border-orange-300"
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
            className="flex items-center gap-2 px-4 py-2 bg-gray-50 border border-gray-200 rounded-full text-sm text-gray-600 cursor-pointer transition-colors hover:bg-gray-100 hover:border-gray-300"
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
            className="flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-full text-sm text-green-700 cursor-pointer transition-colors hover:bg-green-100 hover:border-green-300"
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
            className="flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-sm text-blue-700 cursor-pointer transition-colors hover:bg-blue-100 hover:border-blue-300"
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
            className="flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-full text-sm text-purple-700 cursor-pointer transition-colors hover:bg-purple-100 hover:border-purple-300"
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
          
          <button
            type="button"
            onClick={() => handleAddElement(ElementType.ORDERED_LIST)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-50 border border-orange-200 rounded-full text-sm text-orange-700 cursor-pointer transition-colors hover:bg-orange-100 hover:border-orange-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <line x1="10" y1="6" x2="21" y2="6" />
              <line x1="10" y1="12" x2="21" y2="12" />
              <line x1="10" y1="18" x2="21" y2="18" />
              <path d="M4 6h1v4" />
              <path d="M4 10h2" />
              <path d="M6 4v6" />
              <path d="M4 18h1v4" />
              <path d="M4 22h2" />
              <path d="M6 18v6" />
            </svg>
            Liste numérotée
          </button>
          
          <button
            type="button"
            onClick={() => handleAddElement(ElementType.ACCORDION)}
            className="flex items-center gap-2 px-4 py-2 bg-sky-50 border border-sky-200 rounded-full text-sm text-sky-700 cursor-pointer transition-colors hover:bg-sky-100 hover:border-sky-300"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <rect x="2" y="4" width="20" height="5" rx="2" />
              <rect x="2" y="12" width="20" height="5" rx="2" />
              <path d="M6 9v-1" />
              <path d="M6 17v-1" />
            </svg>
            Accordéon / FAQ
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
        content: '',
        richContent: {
          segments: []
        }
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
    case ElementType.ORDERED_LIST:
      return {
        id,
        type,
        items: []
      }
    case ElementType.ACCORDION:
      return {
        id,
        type,
        title: 'FAQ',
        items: []
      }
    default:
      throw new Error(`Unknown element type: ${type}`)
  }
} 