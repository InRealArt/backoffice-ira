'use client'

import { useState, useEffect } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { BlogContent, BlogSection as BlogSectionType } from './types'
import BlogSection from './BlogSection'
import styles from './BlogSection.module.scss'

interface BlogContentEditorProps {
  initialContent?: BlogContent
  onChange: (content: BlogContent) => void
}

export default function BlogContentEditor({ initialContent = [], onChange }: BlogContentEditorProps) {
  const [sections, setSections] = useState<BlogSectionType[]>(initialContent)
  
  // Mise à jour du contenu parent lorsque les sections changent
  useEffect(() => {
    onChange(sections)
  }, [sections, onChange])
  
  const addSection = () => {
    const newSection: BlogSectionType = {
      id: uuidv4(),
      title: `Section ${sections.length + 1}`,
      elements: []
    }
    
    setSections([...sections, newSection])
  }
  
  const updateSection = (index: number, updated: BlogSectionType) => {
    const newSections = [...sections]
    newSections[index] = updated
    setSections(newSections)
  }
  
  const deleteSection = (index: number) => {
    const newSections = [...sections]
    newSections.splice(index, 1)
    setSections(newSections)
  }
  
  const moveSection = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) || 
      (direction === 'down' && index === sections.length - 1)
    ) {
      return
    }
    
    const newSections = [...sections]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    // Échanger les sections
    [newSections[index], newSections[targetIndex]] = [newSections[targetIndex], newSections[index]]
    
    setSections(newSections)
  }
  
  return (
    <div className="space-y-4">
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">Contenu principal</label>
        
        {sections.length === 0 ? (
          <div className="bg-gray-50 p-8 rounded-md text-center">
            <p className="text-gray-500 mb-4">Aucune section de contenu n'a été ajoutée.</p>
            <button
              type="button"
              onClick={addSection}
              className="btn btn-secondary btn-medium"
            >
              Ajouter une section
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {sections.map((section, index) => (
              <BlogSection
                key={section.id}
                section={section}
                onUpdate={(updated) => updateSection(index, updated)}
                onDelete={() => deleteSection(index)}
                onMoveUp={() => moveSection(index, 'up')}
                onMoveDown={() => moveSection(index, 'down')}
              />
            ))}
          </div>
        )}
        
        {sections.length > 0 && (
          <button
            type="button"
            onClick={addSection}
            className={styles.addSectionButton}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="16" />
              <line x1="8" y1="12" x2="16" y2="12" />
            </svg>
            Ajouter une nouvelle section
          </button>
        )}
      </div>
    </div>
  )
} 