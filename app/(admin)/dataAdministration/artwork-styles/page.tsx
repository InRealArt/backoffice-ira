import { getAllArtworkStyles } from '@/lib/actions/artwork-style-actions'
import ArtworkStyleClient from './ArtworkStyleClient'

export const metadata = {
  title: 'Liste des styles d\'œuvres | Data Administration',
  description: 'Gérez les styles d\'œuvres utilisés sur le site',
}

export default async function ArtworkStylesPage() {
  const artworkStyles = await getAllArtworkStyles()
  return <ArtworkStyleClient artworkStyles={artworkStyles} />
} 