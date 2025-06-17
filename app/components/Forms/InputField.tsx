'use client'

import React, { useEffect, useState, useRef } from 'react'
import styles from './forms.module.css'

interface InputFieldProps {
  id: string
  name: string
  label: string
  type?: string
  value?: string | number
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  register?: any
  error?: string
  min?: string | number
  max?: string | number
  disabled?: boolean
  placeholder?: string
  required?: boolean
  className?: string
  autoComplete?: string
  showErrorsOnlyAfterSubmit?: boolean
}

export function InputField({
  id,
  name,
  label,
  type = 'text',
  value,
  onChange,
  register,
  error,
  min,
  max,
  disabled = false,
  placeholder = '',
  required = false,
  className = '',
  autoComplete,
  showErrorsOnlyAfterSubmit = true
}: InputFieldProps) {
  const [isFormSubmitted, setIsFormSubmitted] = useState(false)
  const [shouldShowError, setShouldShowError] = useState(!showErrorsOnlyAfterSubmit)
  const inputRef = useRef<HTMLDivElement>(null)
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
    if (displayError && inputRef.current && !hasScrolled.current) {
      // Vérifier si l'élément est visible dans la fenêtre
      const rect = inputRef.current.getBoundingClientRect()
      const isVisible = (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      )

      // Si l'élément n'est pas visible, scroll vers lui avec une animation douce
      if (!isVisible) {
        inputRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        })
        hasScrolled.current = true
        
        // Ajouter un effet de surbrillance temporaire
        if (inputRef.current) {
          inputRef.current.classList.add(styles['highlight-error'])
          setTimeout(() => {
            if (inputRef.current) {
              inputRef.current.classList.remove(styles['highlight-error'])
            }
          }, 1500)
        }
      }
    }
  }, [displayError])

  return (
    <div className="form-group" ref={inputRef}>
      <label htmlFor={id} className="form-label" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
        {label}
      </label>
      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        min={min}
        max={max}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`form-input ${displayError ? styles['input-error'] : ''} ${disabled ? styles['input-disabled'] : ''} ${className}`}
        {...(register ? register(name) : {})}
      />
      {displayError && (
        <p className="form-error">{error}</p>
      )}
    </div>
  )
}

export default InputField 