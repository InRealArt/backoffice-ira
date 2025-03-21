'use client'

import { ReactNode, useState, ChangeEvent, SelectHTMLAttributes, InputHTMLAttributes } from 'react'

// Types pour les options de filtres
export interface FilterOption {
  value: string
  label: string
  icon?: ReactNode
}

// Props pour un item de filtre individuel (select)
export interface FilterItemProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  id: string
  label: string
  options: FilterOption[]
  value: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
}

// Props pour le champ de recherche
export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  label?: string
  className?: string
  onSearch?: () => void
}

// Props pour la section de filtres
export interface FiltersProps {
  children: ReactNode
  className?: string
}

// Composant pour la section de filtres complète
export function Filters({ children, className = '' }: FiltersProps) {
  return (
    <div className={`filter-section ${className}`}>
      <div className="d-flex gap-md flex-wrap">
        {children}
      </div>
    </div>
  )
}

// Composant pour un item de filtre individuel
export function FilterItem({
  id,
  label,
  options,
  value,
  onChange,
  className = '',
  placeholder = 'Sélectionner...',
  ...props
}: FilterItemProps) {
  return (
    <div className="filter-item">
      <label htmlFor={id} className="filter-label">
        {label}
      </label>
      <div className="select-wrapper">
        <select
          id={id}
          className={`filter-select ${className}`}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.icon} {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

// Composant pour la recherche
export function SearchInput({
  value,
  onChange,
  placeholder = 'Rechercher...',
  label,
  className = '',
  onSearch,
  ...props
}: SearchInputProps) {
  
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      e.preventDefault()
      onSearch()
    }
  }

  return (
    <div className={`filter-item search-filter ${className}`}>
      {label && <label className="filter-label">{label}</label>}
      <div className="search-input-container">
        <input
          type="text"
          className="search-input"
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          onKeyDown={handleKeyDown}
          {...props}
        />
        <span className="search-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          </svg>
        </span>
      </div>
    </div>
  )
} 