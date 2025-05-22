'use client'

import { useState, ChangeEvent, useRef, useEffect } from 'react'

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  maxTags?: number
  className?: string
  label?: string
  error?: string
  width?: string
}

export default function TagInput({
  tags,
  onChange,
  placeholder = "Ajouter un tag et appuyer sur Entrée",
  maxTags = 10,
  className = '',
  label,
  error,
  width = '100%'
}: TagInputProps) {
  // Suivi de la saisie de l'utilisateur
  const [userInput, setUserInput] = useState<string>('')
  const [isFocused, setIsFocused] = useState<boolean>(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Gérer le changement de l'input
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setUserInput(e.target.value)
  }

  // Gérer l'ajout d'un tag
  const addTag = (tag: string) => {
    const trimmedTag = tag.trim()
    if (
      trimmedTag !== '' &&
      !tags.includes(trimmedTag) &&
      tags.length < maxTags
    ) {
      // Ajouter le nouveau tag à la liste
      const newTags = [...tags, trimmedTag]
      onChange(newTags)
      setUserInput('')
      
      // Animation flash pour indiquer que le tag a été ajouté
      if (containerRef.current) {
        containerRef.current.classList.add('tag-added-flash')
        setTimeout(() => {
          if (containerRef.current) {
            containerRef.current.classList.remove('tag-added-flash')
          }
        }, 300)
      }
      
      // Forcer le rafraîchissement pour assurer que le tag apparaît comme badge
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus()
        }
      }, 10)
    }
  }

  // Gérer la suppression d'un tag
  const removeTag = (tagToRemove: string) => {
    const filteredTags = tags.filter(tag => tag !== tagToRemove)
    onChange(filteredTags)
  }

  // Gérer l'appui sur la touche Entrée
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      // S'assurer que l'input n'est pas vide
      if (userInput.trim() !== '') {
        addTag(userInput)
      }
    } else if (e.key === 'Backspace' && userInput === '' && tags.length > 0) {
      // Supprimer le dernier tag si l'input est vide et que l'utilisateur appuie sur Backspace
      const newTags = [...tags]
      newTags.pop()
      onChange(newTags)
    }
  }

  // Focus sur l'input quand on clique sur le conteneur
  const handleContainerClick = () => {
    if (inputRef.current) {
      inputRef.current.focus()
    }
  }

  // Effet pour faire défiler vers la fin quand un nouveau tag est ajouté
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = containerRef.current.scrollWidth
    }
  }, [tags.length])

  return (
    <div className={`form-group ${className}`} style={{ width }}>
      {label && (
        <label className="form-label">{label}</label>
      )}
      <div 
        ref={containerRef}
        className={`
          flex flex-wrap gap-2 p-2 border rounded-md transition-all duration-200 ease-in-out
          ${isFocused ? 'border-blue-400 shadow-sm ring-1 ring-blue-200' : 'border-gray-300'}
          ${tags.length > 0 ? 'bg-white' : 'bg-gray-50'}
          ${error ? 'border-red-500' : ''}
          hover:border-blue-300 hover:bg-white overflow-x-auto max-h-[120px] scrollbar-thin form-input relative
        `}
        onClick={handleContainerClick}
      >
        {tags.map((tag, index) => (
          <div
            key={`${index}-${tag}`}
            className="inline-flex items-center rounded bg-white border border-gray-300 hover:border-gray-400 transition-colors animate-fadeIn"
            style={{ 
              animationDelay: `${index * 50}ms`,
              display: 'inline-flex',
              alignItems: 'center',
              height: '24px'
            }}
          >
            <span 
              style={{
                backgroundColor: '#2563eb',
                color: 'white',
                borderRadius: '9999px',
                padding: '2px 8px',
                fontSize: '0.75rem',
                fontWeight: '600',
                maxWidth: '150px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'inline-block',
                lineHeight: '1'
              }}
            >{tag}</span>
            <button
              type="button"
              style={{
                marginLeft: '4px',
                marginRight: '2px',
                color: '#000',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '20px',
                width: '20px',
                backgroundColor: '#f3f4f6',
                borderRadius: '50%',
                fontSize: '12px',
                fontWeight: 'bold'
              }}
              onClick={(e) => {
                e.stopPropagation()
                removeTag(tag)
              }}
              aria-label={`Supprimer le tag ${tag}`}
            >
              ×
            </button>
          </div>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={userInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={tags.length < maxTags ? placeholder : `Maximum de ${maxTags} tags atteint`}
          disabled={tags.length >= maxTags}
          className="flex-grow outline-none bg-transparent p-1 min-w-[400px] w-full placeholder-gray-400 focus:placeholder-gray-300 transition-colors"
          style={{ width: '-webkit-fill-available' }}
        />
      </div>

      <div className="flex justify-between items-center mt-1">
        <p className={`text-xs ${tags.length >= maxTags ? 'text-orange-500 font-medium' : 'text-gray-500'}`}>
          {tags.length} / {maxTags} tags
        </p>
        {tags.length > 0 && (
          <button
            type="button"
            onClick={() => onChange([])}
            className="text-xs text-gray-500 hover:text-red-500 transition-colors duration-200 px-2 py-0.5 rounded hover:bg-red-50"
          >
            Tout effacer
          </button>
        )}
      </div>

      {error && (
        <p className="form-error">{error}</p>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes flashBorder {
          0% { border-color: #3b82f6; }
          50% { border-color: #93c5fd; }
          100% { border-color: #e5e7eb; }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        
        .tag-added-flash {
          animation: flashBorder 0.3s ease-out;
        }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #d1d5db;
          border-radius: 10px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }
      `}</style>
    </div>
  )
} 