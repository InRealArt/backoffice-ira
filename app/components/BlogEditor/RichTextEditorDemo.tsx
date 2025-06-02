'use client'

import { useState } from 'react'
import RichTextEditor from './RichTextEditor'
import RichContentRenderer from './RichContentRenderer'
import { RichContent } from './types'

export default function RichTextEditorDemo() {
  const [content, setContent] = useState('Ceci est un exemple de texte avec des liens.')
  const [richContent, setRichContent] = useState<RichContent>({
    segments: [
      {
        id: '1',
        text: 'Ceci est un exemple de texte avec des liens.',
        isLink: false
      }
    ]
  })

  const handleChange = (newContent: string, newRichContent: RichContent) => {
    setContent(newContent)
    setRichContent(newRichContent)
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1rem' }}>Démo - Éditeur de Texte Riche avec Liens</h2>
      
      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>Éditeur :</h3>
        <RichTextEditor
          content={content}
          richContent={richContent}
          onChange={handleChange}
          placeholder="Tapez votre texte ici, sélectionnez du texte et cliquez sur 'Lien' pour créer un lien hypertexte"
          rows={6}
        />
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '0.5rem' }}>Aperçu du rendu :</h3>
        <div style={{ 
          padding: '1rem', 
          border: '1px solid #e5e7eb', 
          borderRadius: '0.5rem',
          backgroundColor: '#f9fafb'
        }}>
          <RichContentRenderer 
            content={content}
            richContent={richContent}
          />
        </div>
      </div>

      <div>
        <h3 style={{ marginBottom: '0.5rem' }}>Données JSON (pour debug) :</h3>
        <pre style={{ 
          padding: '1rem', 
          backgroundColor: '#1f2937', 
          color: '#f9fafb', 
          borderRadius: '0.5rem',
          fontSize: '0.875rem',
          overflow: 'auto'
        }}>
          {JSON.stringify({ content, richContent }, null, 2)}
        </pre>
      </div>
    </div>
  )
} 