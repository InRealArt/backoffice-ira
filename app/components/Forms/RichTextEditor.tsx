'use client'

import { useState, useEffect } from 'react'

interface RichTextEditorProps {
  value: string
  onChange: (content: string) => void
}

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const [content, setContent] = useState(value || '')

  // Mettre à jour le composant parent lorsque le contenu change
  useEffect(() => {
    setContent(value || '')
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)
    onChange(newContent)
  }

  return (
    <div className="w-full">
      <textarea
        value={content}
        onChange={handleChange}
        className="w-full min-h-[300px] form-input resize-none"
        placeholder="Écrivez votre contenu ici..."
      />
      <div className="flex justify-between mt-1">
        <p className="text-xs text-muted-foreground">
          {content.length} caractères
        </p>
        <p className="text-xs text-muted-foreground">
          ~{Math.ceil(content.length / 1500)} min de lecture
        </p>
      </div>
    </div>
  )
} 