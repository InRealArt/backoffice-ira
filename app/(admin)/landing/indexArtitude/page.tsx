import { getAllArtitudeArtists } from '@/lib/actions/artitude-artist-actions'
import IndexArtitudeClient from './IndexArtitudeClient'
import { loadIndexArtitudeSearchParams } from './searchParams'
import type { SearchParams } from 'nuqs/server'

export const metadata = {
  title: 'Index Artitude | In Real Art',
  description: 'Gérez les fiches établissement Artitude des artistes',
}

type PageProps = {
  searchParams: Promise<SearchParams>
}

export default async function IndexArtitudePage({ searchParams }: PageProps) {
  // Charger les paramètres de recherche côté serveur
  const { name } = await loadIndexArtitudeSearchParams(searchParams)

  // Récupérer toutes les fiches Artitude
  const allArtitudeArtists = await getAllArtitudeArtists()

  // Filtrer par nom côté serveur si un filtre est fourni
  const artitudeArtists = name
    ? allArtitudeArtists.filter(aa => {
        const searchTerm = name.toLowerCase()
        const artistName = aa.artist.name?.toLowerCase() || ''
        const artistSurname = aa.artist.surname?.toLowerCase() || ''
        const artistPseudo = aa.artist.pseudo?.toLowerCase() || ''
        return artistName.includes(searchTerm) ||
               artistSurname.includes(searchTerm) ||
               artistPseudo.includes(searchTerm)
      })
    : allArtitudeArtists

  return <IndexArtitudeClient artitudeArtists={artitudeArtists} />
}
