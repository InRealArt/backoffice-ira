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
  const { artistId, sortColumn, sortDirection, page, itemsPerPage } =
    await loadGalleryLjArtworksSearchParams(searchParams)

  const allArtworks = await getAllGalleryLjArtworks()

  // Build deduplicated artist list for the dropdown (sorted by display name)
  const artistsMap = new Map<number, { id: number; label: string }>()
  for (const { artist } of allArtworks) {
    if (!artistsMap.has(artist.id)) {
      const label =
        artist.firstName && artist.lastName
          ? `${artist.firstName} ${artist.lastName}`
          : artist.pseudo
      artistsMap.set(artist.id, { id: artist.id, label })
    }
  }
  const artistOptions = Array.from(artistsMap.values()).sort((a, b) =>
    a.label.localeCompare(b.label, 'fr')
  )

  // Filter by selected artist (0 = all)
  let filteredArtworks = artistId > 0
    ? allArtworks.filter((a) => a.artist.id === artistId)
    : allArtworks

  const sortedArtworks = [...filteredArtworks].sort((a, b) => {
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
      artistOptions={artistOptions}
    />
  )
}
