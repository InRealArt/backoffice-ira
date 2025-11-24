'use client'

import { Search, X } from 'lucide-react'
import { useQueryStates } from 'nuqs'
import { landingArtistsSearchParams } from './searchParams'

export function LandingArtistFilter() {
  const [searchParams, setSearchParams] = useQueryStates(landingArtistsSearchParams, {
    shallow: false
  })

  const handleSearchChange = (value: string) => {
    setSearchParams({ name: value || '' })
  }

  const handleClear = () => {
    setSearchParams({ name: '' })
  }

  return (
    <div className="relative w-full">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400 dark:text-gray-500" />
        </div>
        <input
          type="text"
          value={searchParams.name || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Rechercher par nom, prénom ou pseudo..."
          className="w-full pl-10 pr-10 py-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:focus:border-blue-400 transition-all duration-200 shadow-sm hover:shadow-md dark:shadow-gray-900/20"
        />
        {searchParams.name && (
          <button
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors rounded-r-lg"
            aria-label="Effacer la recherche"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  )
}

