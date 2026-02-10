'use client'

import { Search, X } from 'lucide-react'
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
      <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-4 items-end">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          </div>
          <input
            type="text"
            value={titleInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Rechercher par titre..."
            className="w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md dark:shadow-gray-900/20"
          />
          {titleInput && (
            <button
              onClick={handleClear}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-r-lg"
              aria-label="Effacer la recherche"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-language" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Langue
          </label>
          <select
            id="filter-language"
            value={searchParams.language || ''}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="w-[140px] max-w-full py-3 px-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200"
          >
            <option value="">Toutes les langues</option>
            {languages.map((lang) => (
              <option key={lang.id} value={lang.code}>
                {lang.name} ({lang.code.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-category" className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Catégorie
          </label>
          <select
            id="filter-category"
            value={searchParams.category || ''}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="w-[140px] max-w-full py-3 px-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200"
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
          className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 underline"
        >
          Réinitialiser les filtres
        </button>
      )}
    </div>
  )
}
