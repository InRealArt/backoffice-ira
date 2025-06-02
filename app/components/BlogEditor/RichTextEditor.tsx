'use client'

import { useState, useRef, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { RichContent, TextSegment } from './types'
import LinkModal from './LinkModal'
import styles from './RichTextEditor.module.scss'

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

  // Ouvrir le modal de lien
  const openLinkModal = () => {
    handleTextSelection()
    if (selectedText.trim()) {
      setIsLinkModalOpen(true)
    } else {
      alert('Veuillez sélectionner du texte pour créer un lien')
    }
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
    <div className={styles.richTextEditor}>
      <div className={styles.toolbar}>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            openLinkModal()
          }}
          className={styles.toolbarButton}
          title="Insérer un lien"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          Lien
        </button>
      </div>

      <div className={styles.textareaContainer}>
        <textarea
          ref={textareaRef}
          value={getPlainText(currentRichContent)}
          onChange={(e) => handleTextChange(e.target.value)}
          onMouseUp={handleTextSelection}
          onKeyUp={handleTextSelection}
          placeholder={placeholder}
          className={styles.textarea}
          style={{
            minHeight: `${rows * 1.5}rem`
          }}
          rows={rows}
        />
      </div>

      {/* Aperçu des liens */}
      {currentRichContent.segments.some(s => s.isLink) && (
        <div className={styles.linksPreview}>
          <h5 className={styles.linksTitle}>Liens dans ce paragraphe :</h5>
          <div className={styles.linksList}>
            {currentRichContent.segments
              .filter(segment => segment.isLink)
              .map(segment => (
                <div key={segment.id} className={styles.linkItem}>
                  <div className={styles.linkInfo}>
                    <span className={styles.linkText}>{segment.linkText}</span>
                    <span className={styles.linkUrl}>{segment.linkUrl}</span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      removeLink(segment.id)
                    }}
                    className={styles.removeLinkButton}
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