'use client'

import { useState, useEffect } from 'react'
import styles from './LinkModal.module.scss'

interface LinkModalProps {
  isOpen: boolean
  onClose: () => void
  onInsert: (linkText: string, linkUrl: string) => void
  selectedText: string
  existingUrl?: string
}

export default function LinkModal({
  isOpen,
  onClose,
  onInsert,
  selectedText,
  existingUrl = ''
}: LinkModalProps) {
  const [linkText, setLinkText] = useState('')
  const [linkUrl, setLinkUrl] = useState('')
  const [errors, setErrors] = useState<{ text?: string; url?: string }>({})

  // Initialiser les valeurs quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setLinkText(selectedText)
      setLinkUrl(existingUrl)
      setErrors({})
    }
  }, [isOpen, selectedText, existingUrl])

  // Validation de l'URL
  const isValidUrl = (url: string): boolean => {
    try {
      new URL(url)
      return true
    } catch {
      // Vérifier si c'est une URL relative valide
      return url.startsWith('/') || url.startsWith('#') || url.startsWith('mailto:') || url.startsWith('tel:')
    }
  }

  // Gérer la soumission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation() // Empêcher la propagation vers le formulaire parent
    
    const newErrors: { text?: string; url?: string } = {}
    
    // Validation
    if (!linkText.trim()) {
      newErrors.text = 'Le texte du lien est requis'
    }
    
    if (!linkUrl.trim()) {
      newErrors.url = 'L\'URL est requise'
    } else if (!isValidUrl(linkUrl.trim())) {
      newErrors.url = 'L\'URL n\'est pas valide'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    // Ajouter https:// si l'URL ne commence pas par un protocole
    let finalUrl = linkUrl.trim()
    if (!finalUrl.match(/^https?:\/\//) && !finalUrl.startsWith('/') && !finalUrl.startsWith('#') && !finalUrl.startsWith('mailto:') && !finalUrl.startsWith('tel:')) {
      finalUrl = 'https://' + finalUrl
    }
    
    onInsert(linkText.trim(), finalUrl)
    handleClose()
  }

  // Gérer le clic sur le bouton d'insertion directement
  const handleInsertClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const newErrors: { text?: string; url?: string } = {}
    
    // Validation
    if (!linkText.trim()) {
      newErrors.text = 'Le texte du lien est requis'
    }
    
    if (!linkUrl.trim()) {
      newErrors.url = 'L\'URL est requise'
    } else if (!isValidUrl(linkUrl.trim())) {
      newErrors.url = 'L\'URL n\'est pas valide'
    }
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    
    // Ajouter https:// si l'URL ne commence pas par un protocole
    let finalUrl = linkUrl.trim()
    if (!finalUrl.match(/^https?:\/\//) && !finalUrl.startsWith('/') && !finalUrl.startsWith('#') && !finalUrl.startsWith('mailto:') && !finalUrl.startsWith('tel:')) {
      finalUrl = 'https://' + finalUrl
    }
    
    onInsert(linkText.trim(), finalUrl)
    handleClose()
  }

  // Fermer le modal
  const handleClose = () => {
    setLinkText('')
    setLinkUrl('')
    setErrors({})
    onClose()
  }

  // Gérer l'échappement
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose()
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div 
        className={styles.modalContent} 
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitle}>Insérer un lien</h3>
          <button
            type="button"
            onClick={handleClose}
            className={styles.closeButton}
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <div className={styles.modalForm}>
          <div className={styles.formGroup}>
            <label htmlFor="linkText" className={styles.label}>
              Texte du lien *
            </label>
            <input
              id="linkText"
              type="text"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              className={`${styles.input} ${errors.text ? styles.inputError : ''}`}
              placeholder="Texte qui sera affiché"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleInsertClick(e as any)
                }
              }}
            />
            {errors.text && (
              <span className={styles.errorMessage}>{errors.text}</span>
            )}
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="linkUrl" className={styles.label}>
              URL de destination *
            </label>
            <input
              id="linkUrl"
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              className={`${styles.input} ${errors.url ? styles.inputError : ''}`}
              placeholder="https://exemple.com ou /page-interne"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleInsertClick(e as any)
                }
              }}
            />
            {errors.url && (
              <span className={styles.errorMessage}>{errors.url}</span>
            )}
            <div className={styles.urlHelp}>
              <small>
                Exemples : https://exemple.com, /page-interne, #section, mailto:email@exemple.com
              </small>
            </div>
          </div>

          <div className={styles.modalActions}>
            <button
              type="button"
              onClick={handleClose}
              className={styles.cancelButton}
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleInsertClick}
              className={styles.insertButton}
            >
              Insérer le lien
            </button>
          </div>
        </div>
      </div>
    </div>
  )
} 