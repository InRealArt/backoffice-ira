'use client'

import { useState, useRef, useEffect } from 'react'
import styles from './TagInput.module.scss'

interface TagInputProps {
  value: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  maxTags?: number
  className?: string
}

export function TagInput({
  value = [],
  onChange,
  placeholder = 'Ajouter des tags...',
  maxTags = 10,
  className = ''
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Ajouter un tag quand l'utilisateur appuie sur Entrée ou virgule
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addTag()
    }
    
    // Supprimer le dernier tag quand l'utilisateur appuie sur Backspace avec un champ vide
    if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      removeTag(value.length - 1)
    }
  }

  const addTag = () => {
    const tag = inputValue.trim().toLowerCase()
    if (tag && !value.includes(tag) && value.length < maxTags) {
      onChange([...value, tag])
      setInputValue('')
    }
  }

  const removeTag = (index: number) => {
    const newTags = [...value]
    newTags.splice(index, 1)
    onChange(newTags)
  }

  const handleContainerClick = () => {
    inputRef.current?.focus()
  }

  useEffect(() => {
    // Ajouter un événement blur pour ajouter le tag quand l'utilisateur quitte le champ
    const handleBlur = () => {
      if (inputValue.trim()) {
        addTag()
      }
    }
    
    const input = inputRef.current
    input?.addEventListener('blur', handleBlur)
    
    return () => {
      input?.removeEventListener('blur', handleBlur)
    }
  }, [inputValue])

  return (
    <div 
      ref={containerRef}
      onClick={handleContainerClick}
      className={`${styles.tagContainer} ${className}`}
    >
      {value.map((tag, index) => (
        <span key={index} className={styles.tag}>
          {tag}
          <button
            type="button"
            className={styles.tagRemove}
            onClick={(e) => {
              e.stopPropagation()
              removeTag(index)
            }}
          >
            &times;
          </button>
        </span>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? placeholder : ''}
        className={styles.tagInput}
      />
    </div>
  )
} 