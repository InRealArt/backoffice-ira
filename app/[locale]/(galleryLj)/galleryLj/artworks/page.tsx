import { getAllGalleryLjArtworks } from '@/lib/actions/gallery-lj-artwork-actions'
import { loadGalleryLjArtworksSearchParams } from './searchParams'
import GalleryLjArtworksClient from './GalleryLjArtworksClient'
import type { SearchParams } from 'nuqs/server'

export const metadata = {
  title: 'Œuvres Galerie LJ | Administration',
  description: 'Gérez les œuvres exposées dans la galerie LJ',
}

type PageProps = {
  searchParams: Promise<SearchParams>
}

export default async function GalleryLjArtworksPage({ searchParams }: PageProps) {
  const { sortColumn, sortDirection, page, itemsPerPage } =
    await loadGalleryLjArtworksSearchParams(searchParams)

  const allArtworks = await getAllGalleryLjArtworks()

  const sortedArtworks = [...allArtworks].sort((a, b) => {
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
  const paginatedArtworks = sortedArtworks.slice(startIndex, startIndex + itemsPerPage)

  return (
    <GalleryLjArtworksClient
      artworks={paginatedArtworks}
      totalItems={sortedArtworks.length}
      currentPage={page}
      itemsPerPage={itemsPerPage}
      sortColumn={sortColumn}
      sortDirection={sortDirection}
    />
  )
}
