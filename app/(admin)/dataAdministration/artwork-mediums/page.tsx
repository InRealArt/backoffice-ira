import { getAllArtworkMediums } from '@/lib/actions/artwork-medium-actions'
import ArtworkMediumClient from './ArtworkMediumClient'

export const metadata = {
  title: 'Liste des mediums d\'œuvres | Data Administration',
  description: 'Gérez les mediums d\'œuvres utilisés sur le site',
}

export default async function ArtworkMediumsPage() {
  const artworkMediums = await getAllArtworkMediums()
  return <ArtworkMediumClient artworkMediums={artworkMediums} />
} 