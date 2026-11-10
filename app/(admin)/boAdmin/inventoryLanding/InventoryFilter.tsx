'use client'

import SearchInput from '@/app/components/PageLayout/SearchInput'
import { useQueryStates } from 'nuqs'
import { inventorySearchParams } from './searchParams'

export function InventoryFilter() {
  const [searchParams, setSearchParams] = useQueryStates(inventorySearchParams, {
    shallow: false
  })

  const handleSearchChange = (value: string) => {
    setSearchParams({ name: value || '' })
  }


  return (
    <SearchInput
      value={searchParams.name || ''}
      onChange={handleSearchChange}
      placeholder="Rechercher par nom ou prénom..."
    />
  )
}

