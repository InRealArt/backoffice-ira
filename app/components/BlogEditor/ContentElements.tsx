'use client'

import { useState } from 'react'
import { ElementType, ContentElement, H2Element, H3Element, ParagraphElement, ImageElement, VideoElement, ListElement, AccordionElement, AccordionItemData } from './types'
import { v4 as uuidv4 } from 'uuid'
import styles from './BlogSection.module.scss'

interface ElementProps {
  element: ContentElement
  onUpdate: (updated: ContentElement) => void
  onDelete: () => void
}

export function H2ElementComponent({ element, onUpdate, onDelete }: ElementProps) {
  const h2Element = element as H2Element
  
  return (
    <div className={styles.elementItem}>
      <input
        type="text"
        value={h2Element.content}
        onChange={(e) => onUpdate({ ...h2Element, content: e.target.value })}
        placeholder="Titre H2"
        className="form-input w-full"
      />
      <button 
        type="button" 
        onClick={onDelete}
        className="text-red-500 mt-2"
      >
        Supprimer
      </button>
    </div>
  )
}

export function H3ElementComponent({ element, onUpdate, onDelete }: ElementProps) {
  const h3Element = element as H3Element
  
  return (
    <div className={styles.elementItem}>
      <input
        type="text"
        value={h3Element.content}
        onChange={(e) => onUpdate({ ...h3Element, content: e.target.value })}
        placeholder="Titre H3"
        className="form-input w-full"
      />
      <button 
        type="button" 
        onClick={onDelete}
        className="text-red-500 mt-2"
      >
        Supprimer
      </button>
    </div>
  )
}

export function ParagraphElementComponent({ element, onUpdate, onDelete }: ElementProps) {
  const paragraphElement = element as ParagraphElement
  
  return (
    <div className={styles.elementItem}>
      <textarea
        value={paragraphElement.content}
        onChange={(e) => onUpdate({ ...paragraphElement, content: e.target.value })}
        placeholder="Contenu du paragraphe"
        className="form-textarea w-full"
        rows={4}
      />
      <button 
        type="button" 
        onClick={onDelete}
        className="text-red-500 mt-2"
      >
        Supprimer
      </button>
    </div>
  )
}

export function ImageElementComponent({ element, onUpdate, onDelete }: ElementProps) {
  const imageElement = element as ImageElement
  
  return (
    <div className={styles.elementItem}>
      <input
        type="text"
        value={imageElement.url}
        onChange={(e) => onUpdate({ ...imageElement, url: e.target.value })}
        placeholder="URL de l'image"
        className="form-input w-full mb-2"
      />
      <input
        type="text"
        value={imageElement.alt}
        onChange={(e) => onUpdate({ ...imageElement, alt: e.target.value })}
        placeholder="Texte alternatif"
        className="form-input w-full mb-2"
      />
      <input
        type="text"
        value={imageElement.caption || ''}
        onChange={(e) => onUpdate({ ...imageElement, caption: e.target.value })}
        placeholder="Légende (optionnel)"
        className="form-input w-full"
      />
      {imageElement.url && (
        <div className="mt-3 p-2 border border-gray-200 rounded">
          <img 
            src={imageElement.url} 
            alt={imageElement.alt || "Aperçu"} 
            className="max-w-full h-auto"
          />
        </div>
      )}
      <button 
        type="button" 
        onClick={onDelete}
        className="text-red-500 mt-2"
      >
        Supprimer
      </button>
    </div>
  )
}

export function VideoElementComponent({ element, onUpdate, onDelete }: ElementProps) {
  const videoElement = element as VideoElement
  
  return (
    <div className={styles.elementItem}>
      <input
        type="text"
        value={videoElement.url}
        onChange={(e) => onUpdate({ ...videoElement, url: e.target.value })}
        placeholder="URL de la vidéo (YouTube, Vimeo, etc.)"
        className="form-input w-full mb-2"
      />
      <input
        type="text"
        value={videoElement.caption || ''}
        onChange={(e) => onUpdate({ ...videoElement, caption: e.target.value })}
        placeholder="Légende (optionnel)"
        className="form-input w-full"
      />
      <button 
        type="button" 
        onClick={onDelete}
        className="text-red-500 mt-2"
      >
        Supprimer
      </button>
    </div>
  )
}

export function ListElementComponent({ element, onUpdate, onDelete }: ElementProps) {
  const listElement = element as ListElement
  const [newItem, setNewItem] = useState('')

  const addItem = () => {
    if (newItem.trim()) {
      onUpdate({
        ...listElement,
        items: [...listElement.items, newItem.trim()]
      })
      setNewItem('')
    }
  }

  const removeItem = (index: number) => {
    const newItems = [...listElement.items]
    newItems.splice(index, 1)
    onUpdate({
      ...listElement,
      items: newItems
    })
  }

  const updateItem = (index: number, value: string) => {
    const newItems = [...listElement.items]
    newItems[index] = value
    onUpdate({
      ...listElement,
      items: newItems
    })
  }

  return (
    <div className={styles.elementItem}>
      <div className="mb-4">
        <h4 className="mb-2 font-medium">Éléments de la liste</h4>
        {listElement.items.length === 0 ? (
          <p className="text-gray-500 italic">Aucun élément dans la liste</p>
        ) : (
          <ul className="space-y-2">
            {listElement.items.map((item, index) => (
              <li key={index} className="flex items-center gap-2">
                <span className="text-gray-500">•</span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => updateItem(index, e.target.value)}
                  className="form-input flex-grow"
                />
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className="text-red-500"
                >
                  Supprimer
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="flex gap-2 mb-2">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder="Nouvel élément"
          className="form-input flex-grow"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addItem()
            }
          }}
        />
        <button
          type="button"
          onClick={addItem}
          className="btn btn-secondary btn-small"
        >
          Ajouter
        </button>
      </div>
      
      <button 
        type="button" 
        onClick={onDelete}
        className="text-red-500 mt-4"
      >
        Supprimer la liste
      </button>
    </div>
  )
}

export function AccordionElementComponent({ element, onUpdate, onDelete }: ElementProps) {
  const accordionElement = element as AccordionElement
  const [newItemTitle, setNewItemTitle] = useState('')
  const [newItemContent, setNewItemContent] = useState('')
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null)

  const addItem = () => {
    if (newItemTitle.trim()) {
      const newItem: AccordionItemData = {
        id: uuidv4(),
        title: newItemTitle.trim(),
        content: newItemContent.trim()
      }
      
      onUpdate({
        ...accordionElement,
        items: [...accordionElement.items, newItem]
      })
      
      setNewItemTitle('')
      setNewItemContent('')
    }
  }

  const updateItem = (id: string, updates: Partial<AccordionItemData>) => {
    const newItems = accordionElement.items.map(item => 
      item.id === id ? { ...item, ...updates } : item
    )
    
    onUpdate({
      ...accordionElement,
      items: newItems
    })
  }

  const removeItem = (id: string) => {
    onUpdate({
      ...accordionElement,
      items: accordionElement.items.filter(item => item.id !== id)
    })
  }

  const toggleItemExpand = (id: string) => {
    setExpandedItemId(expandedItemId === id ? null : id)
  }

  return (
    <div className={styles.elementItem}>
      <div className="mb-4">
        <h4 className="text-lg font-medium mb-2">Accordéon / FAQ</h4>
        <input
          type="text"
          value={accordionElement.title || ''}
          onChange={(e) => onUpdate({ ...accordionElement, title: e.target.value })}
          placeholder="Titre de l'accordéon (optionnel)"
          className="form-input w-full mb-4"
        />
        
        {accordionElement.items.length === 0 ? (
          <p className="text-gray-500 italic mb-4">Aucun élément dans l'accordéon</p>
        ) : (
          <div className="border rounded-md mb-4 divide-y">
            {accordionElement.items.map((item) => (
              <div key={item.id} className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div 
                    className="font-medium cursor-pointer flex items-center"
                    onClick={() => toggleItemExpand(item.id)}
                  >
                    <span className="mr-2">{expandedItemId === item.id ? '▼' : '►'}</span>
                    {item.title}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    className="text-red-500 text-sm"
                  >
                    Supprimer
                  </button>
                </div>
                
                {expandedItemId === item.id && (
                  <div className="mt-2 pl-5">
                    <input
                      type="text"
                      value={item.title}
                      onChange={(e) => updateItem(item.id, { title: e.target.value })}
                      placeholder="Titre de l'élément"
                      className="form-input w-full mb-2"
                    />
                    <textarea
                      value={item.content}
                      onChange={(e) => updateItem(item.id, { content: e.target.value })}
                      placeholder="Contenu de l'élément"
                      className="form-textarea w-full"
                      rows={3}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        <div className="border rounded-md p-3 bg-gray-50">
          <h5 className="font-medium mb-2">Ajouter un nouvel élément</h5>
          <input
            type="text"
            value={newItemTitle}
            onChange={(e) => setNewItemTitle(e.target.value)}
            placeholder="Titre de l'élément"
            className="form-input w-full mb-2"
          />
          <textarea
            value={newItemContent}
            onChange={(e) => setNewItemContent(e.target.value)}
            placeholder="Contenu de l'élément"
            className="form-textarea w-full mb-2"
            rows={3}
          />
          <button
            type="button"
            onClick={addItem}
            className="btn btn-secondary btn-small"
            disabled={!newItemTitle.trim()}
          >
            Ajouter l'élément
          </button>
        </div>
      </div>
      
      <button 
        type="button" 
        onClick={onDelete}
        className="text-red-500 mt-2"
      >
        Supprimer l'accordéon
      </button>
    </div>
  )
}

export function ContentElementComponent({ element, onUpdate, onDelete }: ElementProps) {
  switch (element.type) {
    case ElementType.H2:
      return <H2ElementComponent element={element} onUpdate={onUpdate} onDelete={onDelete} />
    case ElementType.H3:
      return <H3ElementComponent element={element} onUpdate={onUpdate} onDelete={onDelete} />
    case ElementType.PARAGRAPH:
      return <ParagraphElementComponent element={element} onUpdate={onUpdate} onDelete={onDelete} />
    case ElementType.IMAGE:
      return <ImageElementComponent element={element} onUpdate={onUpdate} onDelete={onDelete} />
    case ElementType.VIDEO:
      return <VideoElementComponent element={element} onUpdate={onUpdate} onDelete={onDelete} />
    case ElementType.LIST:
      return <ListElementComponent element={element} onUpdate={onUpdate} onDelete={onDelete} />
    case ElementType.ACCORDION:
      return <AccordionElementComponent element={element} onUpdate={onUpdate} onDelete={onDelete} />
    default:
      return null
  }
} 