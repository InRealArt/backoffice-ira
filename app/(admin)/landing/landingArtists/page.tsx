import { getAllLandingArtists } from '@/lib/actions/landing-artist-actions'
import LandingArtistsClient from './LandingArtistsClient'
import { loadLandingArtistsSearchParams } from './searchParams'
import type { SearchParams } from 'nuqs/server'

export const metadata = {
  title: 'Artistes page d\'accueil | In Real Art',
  description: 'Gérez les artistes affichés sur la page d\'accueil du site',
}

type PageProps = {
  searchParams: Promise<SearchParams>
}

export default async function LandingArtistsPage({ searchParams }: PageProps) {
  // Charger les paramètres de recherche côté serveur
  const { name } = await loadLandingArtistsSearchParams(searchParams)
  
  // Récupérer tous les landing artists
  const allLandingArtists = await getAllLandingArtists()
  
  // Filtrer par nom côté serveur si un filtre est fourni
  const landingArtists = name
    ? allLandingArtists.filter(la => {
        const searchTerm = name.toLowerCase()
        const artistName = la.artist.name?.toLowerCase() || ''
        const artistSurname = la.artist.surname?.toLowerCase() || ''
        const artistPseudo = la.artist.pseudo?.toLowerCase() || ''
        return artistName.includes(searchTerm) || 
               artistSurname.includes(searchTerm) || 
               artistPseudo.includes(searchTerm)
      })
    : allLandingArtists

  return <LandingArtistsClient landingArtists={landingArtists} />
} 