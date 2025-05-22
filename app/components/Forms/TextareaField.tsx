'use client'

import React, { useEffect, useState, useRef } from 'react'
import styles from './forms.module.css'

interface TextareaFieldProps {
  id: string
  name: string
  label: string
  value?: string
  onChange?: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  register?: any
  error?: string
  disabled?: boolean
  placeholder?: string
  required?: boolean
  className?: string
  rows?: number
  showErrorsOnlyAfterSubmit?: boolean
}

export function TextareaField({
  id,
  name,
  label,
  value,
  onChange,
  register,
  error,
  disabled = false,
  placeholder = '',
  required = false,
  className = '',
  rows = 4,
  showErrorsOnlyAfterSubmit = true
}: TextareaFieldProps) {
  const [isFormSubmitted, setIsFormSubmitted] = useState(false)
  const [shouldShowError, setShouldShowError] = useState(!showErrorsOnlyAfterSubmit)
  const textareaRef = useRef<HTMLDivElement>(null)
  const hasScrolled = useRef(false)

  useEffect(() => {
    // Si on ne doit pas attendre la soumission, toujours afficher les erreurs
    if (!showErrorsOnlyAfterSubmit) {
      setShouldShowError(true)
      return
    }

    // Sinon, détecter la soumission du formulaire
    const handleFormSubmit = () => {
      setIsFormSubmitted(true)
      setShouldShowError(true)
      
      // Reset le flag pour permettre de scroller à nouveau lors d'une nouvelle soumission
      hasScrolled.current = false
    }

    const form = document.getElementById(id)?.closest('form')
    if (form) {
      form.addEventListener('submit', handleFormSubmit)
    }

    return () => {
      if (form) {
        form.removeEventListener('submit', handleFormSubmit)
      }
    }
  }, [id, showErrorsOnlyAfterSubmit])

  // On n'affiche l'erreur que si shouldShowError est true
  const displayError = shouldShowError && error

  // Effet pour scroll vers l'élément avec erreur si nécessaire
  useEffect(() => {
    if (displayError && textareaRef.current && !hasScrolled.current) {
      // Vérifier si l'élément est visible dans la fenêtre
      const rect = textareaRef.current.getBoundingClientRect()
      const isVisible = (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      )

      // Si l'élément n'est pas visible, scroll vers lui avec une animation douce
      if (!isVisible) {
        textareaRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        })
        hasScrolled.current = true
        
        // Ajouter un effet de surbrillance temporaire
        if (textareaRef.current) {
          textareaRef.current.classList.add(styles['highlight-error'])
          setTimeout(() => {
            if (textareaRef.current) {
              textareaRef.current.classList.remove(styles['highlight-error'])
            }
          }, 1500)
        }
      }
    }
  }, [displayError])

  return (
    <div className="form-group" ref={textareaRef}>
      <label htmlFor={id} className="form-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <textarea
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        placeholder={placeholder}
        className={`form-textarea ${displayError ? styles['input-error'] : ''} ${className}`}
        rows={rows}
        {...(register ? register(name) : {})}
      ></textarea>
      {displayError && (
        <p className="form-error">{error}</p>
      )}
    </div>
  )
}

export default TextareaField 