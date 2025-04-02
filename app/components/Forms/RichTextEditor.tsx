'use client'

import { useState, useEffect } from 'react'

interface RichTextEditorProps {
  value: string
  onChange: (content: string) => void
}

// Fonction utilitaire pour formater le HTML avec indentation
const formatHTML = (html: string): string => {
  if (!html) return ''
  
  let formatted = ''
  let indent = 0
  
  // Remplacer tous les retours à la ligne et espaces multiples par un seul espace
  const tmp = html.replace(/\s+/g, ' ')
  
  // Liste des balises qui augmentent l'indentation
  const indentationTags = ['div', 'p', 'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'tbody', 'thead', 'article', 'section', 'header', 'footer', 'main', 'aside', 'nav', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'figure', 'figcaption']
  
  // Regex pour capturer les balises
  const tagRegex = /<\/?([a-z0-9]+)(?:\s+[^>]*)?\s*>/gi
  
  let lastIndex = 0
  let match
  
  while ((match = tagRegex.exec(tmp)) !== null) {
    const tag = match[1].toLowerCase()
    const isClosingTag = match[0].startsWith('</')
    const isAutoClosingTag = match[0].endsWith('/>')
    
    // Ajouter le texte avant la balise
    const beforeTag = tmp.substring(lastIndex, match.index).trim()
    if (beforeTag) {
      formatted += '\n' + ' '.repeat(indent * 2) + beforeTag
    }
    
    // Ajuster l'indentation pour les balises de bloc
    if (indentationTags.includes(tag)) {
      if (isClosingTag) {
        indent = Math.max(0, indent - 1)
      }
      
      // Ajouter la balise avec l'indentation appropriée
      formatted += '\n' + ' '.repeat(indent * 2) + match[0]
      
      if (!isClosingTag && !isAutoClosingTag) {
        indent++
      }
    } else {
      // Ajouter les autres balises sans modifier l'indentation
      formatted += match[0]
    }
    
    lastIndex = match.index + match[0].length
  }
  
  // Ajouter le reste du texte
  if (lastIndex < tmp.length) {
    const restOfHtml = tmp.substring(lastIndex).trim()
    if (restOfHtml) {
      formatted += '\n' + ' '.repeat(indent * 2) + restOfHtml
    }
  }
  
  return formatted.trim()
}

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const [content, setContent] = useState(value ? formatHTML(value) : '')

  // Mettre à jour le composant parent lorsque le contenu change
  useEffect(() => {
    // Formater le HTML lorsque la valeur change depuis le parent
    const formattedValue = value ? formatHTML(value) : ''
    setContent(formattedValue)
  }, [value])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value
    setContent(newContent)
    onChange(newContent)
  }
  
  // Gérer le collage pour formater automatiquement le HTML
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const clipboardData = e.clipboardData
    const pastedText = clipboardData.getData('text')
    
    // Vérifier si le texte collé ressemble à du HTML
    if (pastedText.trim().startsWith('<') && pastedText.includes('</')) {
      e.preventDefault()
      const formattedHTML = formatHTML(pastedText)
      
      // Insérer le HTML formaté à la position du curseur
      const textarea = e.currentTarget
      const startPos = textarea.selectionStart
      const endPos = textarea.selectionEnd
      
      const textBefore = content.substring(0, startPos)
      const textAfter = content.substring(endPos)
      
      const newValue = textBefore + formattedHTML + textAfter
      setContent(newValue)
      onChange(newValue)
      
      // Mettre à jour la position du curseur après l'insertion
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = startPos + formattedHTML.length
      }, 0)
    }
  }

  return (
    <div className="w-full">
      <textarea
        value={content}
        onChange={handleChange}
        onPaste={handlePaste}
        className="w-full min-h-[300px] form-input resize-vertical"
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