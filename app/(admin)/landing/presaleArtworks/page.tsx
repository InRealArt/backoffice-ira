import { getAllPresaleArtworks } from '@/lib/actions/presale-artwork-actions'
import { getAllArtists } from '@/lib/actions/prisma-actions'
import PresaleArtworksClient from './PresaleArtworksClient'
import { loadPresaleArtworksSearchParams } from './searchParams'
import type { SearchParams } from 'nuqs/server'

export const metadata = {
  title: 'Liste des œuvres en prévente | Administration',
  description: 'Gérez les œuvres en prévente',
}

type PageProps = {
  searchParams: Promise<SearchParams>
}

export default async function PresaleArtworksPage({ searchParams }: PageProps) {
  // Charger les paramètres de recherche côté serveur
  const { artistId, sortColumn, sortDirection, page, itemsPerPage } = await loadPresaleArtworksSearchParams(searchParams)
  
  // Récupérer toutes les œuvres et tous les artistes
  const [presaleArtworksData, allArtists] = await Promise.all([
    getAllPresaleArtworks(),
    getAllArtists()
  ])
  
  // Transformer les données pour s'assurer que 'order' est toujours un nombre
  const presaleArtworks = presaleArtworksData.map(artwork => ({
    ...artwork,
    order: artwork.order ?? 0 // Utiliser 0 comme valeur par défaut si null
  }))

  // Filtrer par artiste côté serveur si un artiste est sélectionné
  const filteredArtworks = artistId
    ? presaleArtworks.filter(artwork => artwork.artistId === artistId)
    : presaleArtworks

  // Trier les œuvres côté serveur
  const sortedArtworks = [...filteredArtworks].sort((a, b) => {
    const valueA = (a as any)[sortColumn] ?? 0
    const valueB = (b as any)[sortColumn] ?? 0
    
    if (sortDirection === 'asc') {
      return typeof valueA === 'string' 
        ? valueA.localeCompare(valueB) 
        : valueA - valueB
    } else {
      return typeof valueA === 'string' 
        ? valueB.localeCompare(valueA) 
        : valueB - valueA
    }
  })

  // Calculer la pagination côté serveur
  const startIndex = (page - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedArtworks = sortedArtworks.slice(startIndex, endIndex)

  return (
    <PresaleArtworksClient 
      presaleArtworks={paginatedArtworks}
      totalItems={sortedArtworks.length}
      currentPage={page}
      itemsPerPage={itemsPerPage}
      selectedArtistId={artistId}
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      allArtists={allArtists}
    />
  )
} 