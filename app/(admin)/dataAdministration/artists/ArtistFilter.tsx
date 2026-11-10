'use client'

import SearchInput from '@/app/components/PageLayout/SearchInput'
import { useQueryStates } from 'nuqs'
import { artistsSearchParams } from './searchParams'

export function ArtistFilter() {
  const [searchParams, setSearchParams] = useQueryStates(artistsSearchParams, {
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

