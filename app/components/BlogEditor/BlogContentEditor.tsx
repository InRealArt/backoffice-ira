'use client'

import { useEffect } from 'react'
import { BlogContent } from './types'
import BlogSection from './BlogSection'
import { useSectionOrdering } from './hooks/useSectionOrdering'
import styles from './BlogSection.module.scss'

interface BlogContentEditorProps {
  initialContent?: BlogContent
  onChange: (content: BlogContent) => void
}

export default function BlogContentEditor({ initialContent = [], onChange }: BlogContentEditorProps) {
  const {
    sections,
    addSection,
    updateSection,
    deleteSection,
    moveSection,
    canMoveUp,
    canMoveDown
  } = useSectionOrdering(initialContent)

  // Mise à jour du contenu parent lorsque les sections changent
  useEffect(() => {
    onChange(sections)
  }, [sections, onChange])

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
                index={index}
                onUpdate={(updated) => updateSection(index, updated)}
                onDelete={() => deleteSection(index)}
                onMoveUp={() => moveSection(index, 'up')}
                onMoveDown={() => moveSection(index, 'down')}
                canMoveUp={canMoveUp(index)}
                canMoveDown={canMoveDown(index)}
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