import { getAllLandingArtists } from '@/lib/actions/landing-artist-actions'
import LandingArtistsClient from './LandingArtistsClient'

export const metadata = {
  title: 'Artistes page d\'accueil | In Real Art',
  description: 'Gérez les artistes affichés sur la page d\'accueil du site',
}

export default async function LandingArtistsPage() {
  const landingArtists = await getAllLandingArtists()

  return <LandingArtistsClient landingArtists={landingArtists} />
} 