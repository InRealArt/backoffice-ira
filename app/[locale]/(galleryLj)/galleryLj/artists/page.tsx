import { getAllGalleryLjArtists } from '@/lib/actions/gallery-lj-artist-actions'
import { loadGalleryLjArtistsSearchParams } from './searchParams'
import GalleryLjArtistsClient from './GalleryLjArtistsClient'
import type { SearchParams } from 'nuqs/server'

export const metadata = {
  title: 'Artistes Galerie LJ | Administration',
  description: 'Gérez les artistes exposés dans la galerie LJ',
}

type PageProps = {
  searchParams: Promise<SearchParams>
}

export default async function GalleryLjArtistsPage({ searchParams }: PageProps) {
  const { sortColumn, sortDirection, page, itemsPerPage } =
    await loadGalleryLjArtistsSearchParams(searchParams)

  const allArtists = await getAllGalleryLjArtists()

  const sortedArtists = [...allArtists].sort((a, b) => {
    const valueA = (a as Record<string, unknown>)[sortColumn] ?? ''
    const valueB = (b as Record<string, unknown>)[sortColumn] ?? ''
    if (sortDirection === 'asc') {
      return typeof valueA === 'string'
        ? valueA.localeCompare(valueB as string)
        : (valueA as number) - (valueB as number)
    } else {
      return typeof valueA === 'string'
        ? (valueB as string).localeCompare(valueA)
        : (valueB as number) - (valueA as number)
    }
  })

  const startIndex = (page - 1) * itemsPerPage
  const paginatedArtists = sortedArtists.slice(startIndex, startIndex + itemsPerPage)

  return (
    <GalleryLjArtistsClient
      artists={paginatedArtists}
      totalItems={sortedArtists.length}
      currentPage={page}
      itemsPerPage={itemsPerPage}
      sortColumn={sortColumn}
      sortDirection={sortDirection}
    />
  )
}
