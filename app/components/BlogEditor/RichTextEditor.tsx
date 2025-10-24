'use client'

import { useState, useRef, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { RichContent, TextSegment } from './types'
import LinkModal from './LinkModal'

interface RichTextEditorProps {
  content: string
  richContent?: RichContent
  onChange: (content: string, richContent: RichContent) => void
  placeholder?: string
  rows?: number
}

export default function RichTextEditor({
  content,
  richContent,
  onChange,
  placeholder = "Contenu du paragraphe",
  rows = 4
}: RichTextEditorProps) {
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false)
  const [selectedText, setSelectedText] = useState('')
  const [selectionStart, setSelectionStart] = useState(0)
  const [selectionEnd, setSelectionEnd] = useState(0)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Initialiser richContent si pas fourni
  const currentRichContent = richContent || {
    segments: content ? [{ id: uuidv4(), text: content, isLink: false }] : []
  }

  // Convertir richContent en texte brut pour l'affichage dans le textarea
  const getPlainText = useCallback((richContent: RichContent): string => {
    return richContent.segments.map(segment => 
      segment.isLink ? segment.linkText || segment.text : segment.text
    ).join('')
  }, [])

  // Gérer la sélection de texte
  const handleTextSelection = () => {
    if (!textareaRef.current) return

    const start = textareaRef.current.selectionStart
    const end = textareaRef.current.selectionEnd
    const selectedText = textareaRef.current.value.substring(start, end)

    if (selectedText.trim()) {
      setSelectedText(selectedText)
      setSelectionStart(start)
      setSelectionEnd(end)
    }
  }

  // Vérifier si le texte sélectionné a un formatage spécifique
  const hasFormat = (format: 'bold' | 'italic' | 'underline'): boolean => {
    if (!selectedText) return false
    
    for (const segment of currentRichContent.segments) {
      const segmentText = segment.isLink ? segment.linkText || segment.text : segment.text
      if (segmentText === selectedText) {
        switch (format) {
          case 'bold':
            return segment.isBold || false
          case 'italic':
            return segment.isItalic || false
          case 'underline':
            return segment.isUnderline || false
        }
      }
    }
    return false
  }

  // Ouvrir le modal de lien
  const openLinkModal = () => {
    handleTextSelection()
    if (selectedText.trim()) {
      setIsLinkModalOpen(true)
    } else {
      alert('Veuillez sélectionner du texte pour créer un lien')
    }
  }

  // Appliquer un format (gras, italique, souligné)
  const applyFormat = (format: 'bold' | 'italic' | 'underline') => {
    let start = selectionStart
    let end = selectionEnd
    // Si le textarea est focus, on lit la sélection courante
    if (textareaRef.current) {
      start = textareaRef.current.selectionStart
      end = textareaRef.current.selectionEnd
    }
    const plainText = getPlainText(currentRichContent)
    const beforeText = plainText.substring(0, start)
    const selected = plainText.substring(start, end)
    const afterText = plainText.substring(end)
    if (!selected) return

    // Vérifier si le texte sélectionné a déjà ce formatage
    let hasExistingFormat = false
    let existingSegment: TextSegment | null = null
    
    // Chercher si le texte sélectionné correspond exactement à un segment existant
    for (const segment of currentRichContent.segments) {
      const segmentText = segment.isLink ? segment.linkText || segment.text : segment.text
      if (segmentText === selected) {
        existingSegment = segment
        switch (format) {
          case 'bold':
            hasExistingFormat = segment.isBold || false
            break
          case 'italic':
            hasExistingFormat = segment.isItalic || false
            break
          case 'underline':
            hasExistingFormat = segment.isUnderline || false
            break
        }
        break
      }
    }

    const newSegments: TextSegment[] = []
    
    if (beforeText) {
      newSegments.push({
        id: uuidv4(),
        text: beforeText,
        isLink: false
      })
    }
    
    // Si on a un segment existant, on préserve ses autres formatages
    if (existingSegment) {
      newSegments.push({
        ...existingSegment,
        id: uuidv4(),
        text: selected,
        isLink: existingSegment.isLink,
        linkUrl: existingSegment.linkUrl,
        linkText: existingSegment.linkText,
        isBold: format === 'bold' ? !hasExistingFormat : existingSegment.isBold,
        isItalic: format === 'italic' ? !hasExistingFormat : existingSegment.isItalic,
        isUnderline: format === 'underline' ? !hasExistingFormat : existingSegment.isUnderline
      })
    } else {
      // Nouveau segment avec le formatage demandé
      newSegments.push({
        id: uuidv4(),
        text: selected,
        isLink: false,
        isBold: format === 'bold',
        isItalic: format === 'italic',
        isUnderline: format === 'underline'
      })
    }
    
    if (afterText) {
      newSegments.push({
        id: uuidv4(),
        text: afterText,
        isLink: false
      })
    }
    
    const newRichContent: RichContent = { segments: newSegments }
    const newPlainText = getPlainText(newRichContent)
    onChange(newPlainText, newRichContent)
    setSelectedText('')
  }

  // Insérer un lien
  const insertLink = (linkText: string, linkUrl: string) => {
    const plainText = getPlainText(currentRichContent)
    
    // Créer les nouveaux segments
    const beforeText = plainText.substring(0, selectionStart)
    const afterText = plainText.substring(selectionEnd)
    
    const newSegments: TextSegment[] = []
    
    // Ajouter le texte avant si il existe
    if (beforeText) {
      newSegments.push({
        id: uuidv4(),
        text: beforeText,
        isLink: false
      })
    }
    
    // Ajouter le lien
    newSegments.push({
      id: uuidv4(),
      text: linkUrl,
      isLink: true,
      linkUrl: linkUrl,
      linkText: linkText
    })
    
    // Ajouter le texte après si il existe
    if (afterText) {
      newSegments.push({
        id: uuidv4(),
        text: afterText,
        isLink: false
      })
    }
    
    const newRichContent: RichContent = { segments: newSegments }
    const newPlainText = getPlainText(newRichContent)
    
    onChange(newPlainText, newRichContent)
    setIsLinkModalOpen(false)
    setSelectedText('')
  }

  // Gérer les changements de texte
  const handleTextChange = (newText: string) => {
    // Pour les changements simples, on met à jour le contenu en gardant la structure simple
    const newRichContent: RichContent = {
      segments: newText ? [{ id: uuidv4(), text: newText, isLink: false }] : []
    }
    
    onChange(newText, newRichContent)
  }

  // Supprimer un lien
  const removeLink = (segmentId: string) => {
    const newSegments = currentRichContent.segments.map(segment => {
      if (segment.id === segmentId && segment.isLink) {
        return {
          ...segment,
          isLink: false,
          linkUrl: undefined,
          linkText: undefined,
          text: segment.linkText || segment.text
        }
      }
      return segment
    })
    
    const newRichContent: RichContent = { segments: newSegments }
    const newPlainText = getPlainText(newRichContent)
    
    onChange(newPlainText, newRichContent)
  }

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white w-full">
      <div className="flex items-center gap-2 p-2 bg-gray-50 border-b border-gray-300">
        <button
          type="button"
          onClick={e => {
            e.preventDefault()
            e.stopPropagation()
            applyFormat('bold')
          }}
          className={`flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-gray-700 text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-900 active:bg-gray-200 active:transform active:translate-y-px ${hasFormat('bold') ? 'bg-blue-500 border-blue-600 text-white hover:bg-blue-600 hover:border-blue-700' : ''}`}
          title="Gras"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M6 4h8a4 4 0 0 1 0 8H6zm0 8h9a4 4 0 0 1 0 8H6z"/></svg>
          Gras
        </button>
        <button
          type="button"
          onClick={e => {
            e.preventDefault()
            e.stopPropagation()
            applyFormat('italic')
          }}
          className={`flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-gray-700 text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-900 active:bg-gray-200 active:transform active:translate-y-px ${hasFormat('italic') ? 'bg-blue-500 border-blue-600 text-white hover:bg-blue-600 hover:border-blue-700' : ''}`}
          title="Italique"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>
          Italique
        </button>
        <button
          type="button"
          onClick={e => {
            e.preventDefault()
            e.stopPropagation()
            applyFormat('underline')
          }}
          className={`flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-gray-700 text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-900 active:bg-gray-200 active:transform active:translate-y-px ${hasFormat('underline') ? 'bg-blue-500 border-blue-600 text-white hover:bg-blue-600 hover:border-blue-700' : ''}`}
          title="Souligné"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><path d="M6 4v6a6 6 0 0 0 12 0V4"/><line x1="4" y1="20" x2="20" y2="20"/></svg>
          Souligné
        </button>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            openLinkModal()
          }}
          className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-gray-700 text-sm font-medium cursor-pointer transition-all duration-200 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-900 active:bg-gray-200 active:transform active:translate-y-px"
          title="Insérer un lien"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          Lien
        </button>
      </div>

      <div className="w-full relative">
        <textarea
          ref={textareaRef}
          value={getPlainText(currentRichContent)}
          onChange={(e) => handleTextChange(e.target.value)}
          onMouseUp={handleTextSelection}
          onKeyUp={handleTextSelection}
          placeholder={placeholder}
          className="w-full p-3 border-0 resize-none outline-none font-inherit text-sm leading-relaxed bg-transparent box-border"
          style={{
            minHeight: `${rows * 1.5}rem`
          }}
          rows={rows}
        />
      </div>

      {/* Aperçu du texte formaté */}
      <div style={{margin: '1rem 0'}}>
        {currentRichContent.segments.map(segment => {
          if (segment.isLink) {
            return (
              <a key={segment.id} href={segment.linkUrl} className="text-blue-600 underline hover:text-blue-800" target="_blank" rel="noopener noreferrer">
                {segment.linkText || segment.text}
              </a>
            )
          }
          let classNames = ''
          if (segment.isBold) classNames += 'font-bold '
          if (segment.isItalic) classNames += 'italic '
          if (segment.isUnderline) classNames += 'underline '
          return (
            <span key={segment.id} className={classNames.trim()}>{segment.text}</span>
          )
        })}
      </div>

      {/* Aperçu des liens */}
      {currentRichContent.segments.some(s => s.isLink) && (
        <div className="p-3 bg-gray-50 border-t border-gray-300">
          <h5 className="text-sm font-semibold text-gray-700 m-0 mb-2">Liens dans ce paragraphe :</h5>
          <div className="flex flex-col gap-2">
            {currentRichContent.segments
              .filter(segment => segment.isLink)
              .map(segment => (
                <div key={segment.id} className="flex items-center justify-between p-2 bg-white border border-gray-300 rounded-md text-sm">
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <span className="font-medium text-gray-900 break-words">{segment.linkText}</span>
                    <span className="text-gray-500 text-xs break-all">{segment.linkUrl}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      removeLink(segment.id)
                    }}
                    className="flex items-center justify-center w-6 h-6 bg-red-100 border border-red-200 rounded text-red-600 text-base font-bold cursor-pointer transition-all duration-200 hover:bg-red-200 hover:border-red-300 hover:text-red-700 ml-2"
                    title="Supprimer le lien"
                  >
                    ×
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      <LinkModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        onInsert={insertLink}
        selectedText={selectedText}
      />
    </div>
  )
} 