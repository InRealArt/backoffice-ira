'use client'

import { useState, useRef, useEffect } from 'react'
import { X, ChevronDown, Check } from 'lucide-react'

export interface MultiSelectOption {
  id: number | string
  name: string
}

interface MultiSelectProps {
  options: MultiSelectOption[]
  value: (number | string)[]
  onChange: (value: (number | string)[]) => void
  placeholder?: string
  label?: string
  required?: boolean
  error?: string
  disabled?: boolean
  className?: string
}

export default function MultiSelect({
  options,
  value = [],
  onChange,
  placeholder = 'Sélectionner...',
  label,
  required = false,
  error,
  disabled = false,
  className = ''
}: MultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [dropdownPosition, setDropdownPosition] = useState<'bottom' | 'top'>('bottom')
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Fermer le dropdown quand on clique à l'extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm('')
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus sur le champ de recherche quand on ouvre et calculer la position
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
    
    // Calculer la position du dropdown pour éviter l'overflow
    const updatePosition = () => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const spaceBelow = window.innerHeight - rect.bottom
      const spaceAbove = rect.top
      const dropdownHeight = 256 // max-h-64 = 16rem = 256px
      
      // Si pas assez d'espace en dessous mais assez au-dessus, ouvrir vers le haut
        const newPosition = spaceBelow < dropdownHeight && spaceAbove > spaceBelow ? 'top' : 'bottom'
        setDropdownPosition(newPosition)
        
        // Calculer le style du dropdown en fixed
        if (newPosition === 'top') {
          setDropdownStyle({
            width: `${rect.width}px`,
            left: `${rect.left}px`,
            bottom: `${window.innerHeight - rect.top + 4}px`,
            top: 'auto'
          })
      } else {
          setDropdownStyle({
            width: `${rect.width}px`,
            left: `${rect.left}px`,
            top: `${rect.bottom + 4}px`,
            bottom: 'auto'
          })
        }
      }
    }
    
    updatePosition()
    
    // Mettre à jour la position lors du scroll ou du resize
    if (isOpen) {
      window.addEventListener('scroll', updatePosition, true)
      window.addEventListener('resize', updatePosition)
      
      return () => {
        window.removeEventListener('scroll', updatePosition, true)
        window.removeEventListener('resize', updatePosition)
      }
    }
  }, [isOpen])

  // Filtrer les options selon la recherche
  const filteredOptions = options.filter(option =>
    option.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Obtenir les options sélectionnées
  const selectedOptions = options.filter(option => value.includes(option.id))

  // Toggle une option
  const toggleOption = (optionId: number | string) => {
    if (disabled) return

    const newValue = value.includes(optionId)
      ? value.filter(id => id !== optionId)
      : [...value, optionId]
    
    onChange(newValue)
  }

  // Supprimer une option sélectionnée
  const removeOption = (optionId: number | string, e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled) return
    onChange(value.filter(id => id !== optionId))
  }

  return (
    <div className={`relative ${className}`} ref={containerRef} style={{ zIndex: isOpen ? 10000 : 'auto' }}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Conteneur principal */}
      <div
        className={`ms-control relative w-full border transition-all duration-200 ${error ? 'ms-control-error' : ''} ${disabled ? 'ms-control-disabled cursor-not-allowed' : 'cursor-pointer'}`}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={label}
        aria-disabled={disabled || undefined}
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          // Seulement les touches du champ lui-même (pas celles des boutons de retrait des puces)
          if (disabled || e.target !== e.currentTarget) return
          if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
            e.preventDefault()
            setIsOpen(true)
          } else if (e.key === 'Escape') {
            setIsOpen(false)
            setSearchTerm('')
          }
        }}
        onClick={() => !disabled && setIsOpen(!isOpen)}
      >
        {/* Selected items + placeholder */}
        <div className="flex flex-wrap gap-1.5 p-2 pr-10">
          {selectedOptions.length === 0 ? (
            <span className="text-gray-400 dark:text-gray-500 text-sm py-0.5">
              {placeholder}
            </span>
          ) : (
            selectedOptions.map(option => (
              <span
                key={option.id}
                className="ms-chip inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-sm font-medium transition-colors"
              >
                {option.name}
                <button
                  type="button"
                  onClick={(e) => removeOption(option.id, e)}
                  disabled={disabled}
                  className="ms-chip-remove ml-0.5 disabled:cursor-not-allowed"
                  aria-label={`Supprimer ${option.name}`}
                >
                  <X size={14} strokeWidth={2.5} />
                </button>
              </span>
            ))
          )}
        </div>

        {/* Chevron icon */}
        <div className="ms-chevron absolute right-2 pointer-events-none">
          <ChevronDown
            size={20}
            className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          />
        </div>
      </div>

      {/* Dropdown */}
      {isOpen && !disabled && (
        <div 
          ref={dropdownRef}
          className="ms-dropdown fixed border shadow-xl max-h-64 overflow-hidden"
          style={{ ...dropdownStyle, zIndex: 10000 }}
        >
          {/* Search input */}
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher..."
              className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
              onClick={(e) => e.stopPropagation()}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setIsOpen(false)
                  setSearchTerm('')
                }
              }}
            />
          </div>

          {/* Options list */}
          <div className="overflow-y-auto max-h-48">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                Aucun résultat trouvé
              </div>
            ) : (
              filteredOptions.map(option => {
                const isSelected = value.includes(option.id)
                return (
                  <div
                    key={option.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleOption(option.id)
                    }}
                    className={`
                      flex items-center justify-between px-4 py-2.5 cursor-pointer transition-colors
                      ms-option ${isSelected ? 'ms-option-selected' : ''}
                    `}
                  >
                    <span className="text-sm font-medium">{option.name}</span>
                    {isSelected && (
                      <Check size={18} className="ms-check" strokeWidth={2.5} />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}

      {/* Selected count helper */}
      {selectedOptions.length > 0 && !error && (
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {selectedOptions.length} élément{selectedOptions.length > 1 ? 's' : ''} sélectionné{selectedOptions.length > 1 ? 's' : ''}
        </p>
      )}
    </div>
  )
}

