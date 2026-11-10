'use client'

import React from 'react'
import { Search, X } from 'lucide-react'
import styles from './SearchInput.module.scss'

interface SearchInputProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  /** Nom accessible du champ (par défaut : le placeholder) */
  label?: string
  className?: string
}

/** Champ de recherche commun aux filtres des listes du backoffice. */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Rechercher...',
  label,
  className = ''
}: SearchInputProps) {
  return (
    <div className={`${styles.wrapper} ${className}`}>
      <Search className={styles.icon} aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={label ?? placeholder}
        className={styles.input}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className={styles.clear}
          aria-label="Effacer la recherche"
        >
          <X aria-hidden="true" />
        </button>
      )}
    </div>
  )
}

export default SearchInput
