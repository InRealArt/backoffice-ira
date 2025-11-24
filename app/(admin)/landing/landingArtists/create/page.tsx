import { getArtistsNotInLanding } from '@/lib/actions/landing-artist-actions'
import { unstable_noStore as noStore } from 'next/cache'
import CreateLandingArtistForm from './CreateLandingArtistForm'
import { getAllArtworkMediums } from '@/lib/actions/artwork-medium-actions'
import { getAllArtistCategories } from '@/lib/actions/artist-categories-actions'

export const metadata = {
  title: 'Ajouter un artiste | Page d\'accueil',
  description: 'Ajouter un nouvel artiste à la page d\'accueil du site',
}

export default async function CreateLandingArtistPage() {
  // Forcer la récupération des données en temps réel sans cache
  noStore()
  
  // Récupérer tous les artistes qui ne sont pas déjà présents dans la table LandingArtist
  const [artists, mediums, categories] = await Promise.all([
    getArtistsNotInLanding(),
    getAllArtworkMediums(),
    getAllArtistCategories()
  ])

  return <CreateLandingArtistForm artists={artists} mediums={mediums.map(m => m.name)} categories={categories} />
} 