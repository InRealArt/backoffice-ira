'use client'

import SearchInput from '@/app/components/PageLayout/SearchInput'
import { useQueryStates } from 'nuqs'
import { indexArtitudeSearchParams } from './searchParams'

export function IndexArtitudeFilter() {
  const [searchParams, setSearchParams] = useQueryStates(indexArtitudeSearchParams, {
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
