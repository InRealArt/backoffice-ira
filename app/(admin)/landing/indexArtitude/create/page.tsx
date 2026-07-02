import { getArtistsNotInArtitude } from '@/lib/actions/artitude-artist-actions'
import { getAllCountries } from '@/lib/actions/country-actions'
import { unstable_noStore as noStore } from 'next/cache'
import CreateArtitudeArtistForm from './CreateArtitudeArtistForm'

export const metadata = {
  title: 'Ajouter une fiche Artitude | In Real Art',
  description: 'Ajouter une nouvelle fiche établissement Artitude pour un artiste',
}

export default async function CreateArtitudeArtistPage() {
  // Forcer la récupération des données en temps réel sans cache
  noStore()

  const [artists, countries] = await Promise.all([
    getArtistsNotInArtitude(),
    getAllCountries()
  ])

  return <CreateArtitudeArtistForm artists={artists} countries={countries} />
}
