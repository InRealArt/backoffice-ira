'use client'

import SearchInput from '@/app/components/PageLayout/SearchInput'
import { useCallback, useEffect, useState } from 'react'
import { useQueryStates } from 'nuqs'
import { seoPostsSearchParams } from './searchParams'

const TITLE_DEBOUNCE_MS = 300

interface LanguageOption {
  id: number
  code: string
  name: string
}

interface CategoryOption {
  id: number
  name: string
}

interface SeoPostFilterProps {
  languages: LanguageOption[]
  categories: CategoryOption[]
}

export function SeoPostFilter({ languages, categories }: SeoPostFilterProps) {
  const [searchParams, setSearchParams] = useQueryStates(seoPostsSearchParams, {
    shallow: true
  })
  const [titleInput, setTitleInput] = useState(searchParams.title || '')

  useEffect(() => {
    setTitleInput(searchParams.title || '')
  }, [searchParams.title])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const current = titleInput.trim()
      if (current === (searchParams.title || '')) return
      setSearchParams({ title: current || '' })
    }, TITLE_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [titleInput, searchParams.title, setSearchParams])

  const handleSearchChange = useCallback((value: string) => {
    setTitleInput(value)
  }, [])

  const handleClear = useCallback(() => {
    setTitleInput('')
    setSearchParams({ title: '' })
  }, [setSearchParams])

  const handleLanguageChange = (value: string) => {
    setSearchParams({ language: value || '' })
  }

  const handleCategoryChange = (value: string) => {
    setSearchParams({ category: value || '' })
  }

  const hasActiveFilters = searchParams.title || searchParams.language || searchParams.category

  const handleClearAll = useCallback(() => {
    setTitleInput('')
    setSearchParams({ title: '', language: '', category: '' })
  }, [setSearchParams])

  return (
    <div className="space-y-4">
      <div className="filter-grid">
        <SearchInput
          value={titleInput}
          onChange={(value) => (value ? handleSearchChange(value) : handleClear())}
          placeholder="Rechercher par titre..."
        />
        <div className="filter-field">
          <label htmlFor="filter-language" className="form-label">
            Langue
          </label>
          <select
            id="filter-language"
            value={searchParams.language || ''}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="form-select w-full md:w-[160px]"
          >
            <option value="">Toutes les langues</option>
            {languages.map((lang) => (
              <option key={lang.id} value={lang.code}>
                {lang.name} ({lang.code.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
        <div className="filter-field">
          <label htmlFor="filter-category" className="form-label">
            Catégorie
          </label>
          <select
            id="filter-category"
            value={searchParams.category || ''}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="form-select w-full md:w-[160px]"
          >
            <option value="">Toutes les catégories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={String(cat.id)}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      {hasActiveFilters && (
        <button
          type="button"
          onClick={handleClearAll}
          className="text-sm underline text-text-secondary hover:text-text-primary"
        >
          Réinitialiser les filtres
        </button>
      )}
    </div>
  )
}
