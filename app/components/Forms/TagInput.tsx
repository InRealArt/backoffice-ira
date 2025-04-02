'use client'

import { useState, ChangeEvent } from 'react'

interface TagInputProps {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
  maxTags?: number
}

export default function TagInput({
  tags,
  onChange,
  placeholder = "Ajouter un tag et appuyer sur Entrée",
  maxTags = 10
}: TagInputProps) {
  // Suivi de la saisie de l'utilisateur
  const [userInput, setUserInput] = useState<string>('')

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
      const newTags = [...tags, trimmedTag]
      onChange(newTags)
      setUserInput('')
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
      addTag(userInput)
    }
  }

  return (
    <div className="w-full">
      <div className="flex flex-wrap gap-2 p-2 border rounded-md bg-gray-50 mb-2">
        {tags.map((tag, index) => (
          <div
            key={`${index}-${tag}`}
            className="inline-flex items-center px-2.5 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
          >
            {tag}
            <button
              type="button"
              className="ml-1.5 text-blue-700 hover:text-blue-900"
              onClick={() => removeTag(tag)}
              aria-label={`Supprimer le tag ${tag}`}
            >
              &times;
            </button>
          </div>
        ))}
        <input
          type="text"
          value={userInput}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={tags.length < maxTags ? placeholder : `Maximum de ${maxTags} tags atteint`}
          disabled={tags.length >= maxTags}
          className="flex-grow outline-none bg-transparent p-1 min-w-[120px]"
        />
      </div>
      {maxTags > 0 && (
        <p className="text-sm text-gray-500">
          {tags.length} / {maxTags} tags
        </p>
      )}
    </div>
  )
} 