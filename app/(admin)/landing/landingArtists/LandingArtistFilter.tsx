'use client'

import SearchInput from '@/app/components/PageLayout/SearchInput'
import { useQueryStates } from 'nuqs'
import { landingArtistsSearchParams } from './searchParams'

export function LandingArtistFilter() {
  const [searchParams, setSearchParams] = useQueryStates(landingArtistsSearchParams, {
    shallow: false
  })

  const handleSearchChange = (value: string) => {
    setSearchParams({ name: value || '' })
  }


  return (
    <SearchInput
      value={searchParams.name || ''}
      onChange={handleSearchChange}
      placeholder="Rechercher par nom, prénom ou pseudo..."
    />
  )
}

