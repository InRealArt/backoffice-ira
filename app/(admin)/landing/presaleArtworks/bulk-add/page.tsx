import { getAllArtistsAndGalleries } from '@/lib/actions/artist-actions'
import BulkAddForm from './BulkAddForm'

export const metadata = {
  title: 'Ajout en masse d\'œuvres en prévente | Administration',
  description: 'Ajoutez plusieurs œuvres en prévente en une seule fois',
}

export default async function BulkAddPage() {
  // Récupérer tous les artistes
  const artists = await getAllArtistsAndGalleries()

  return <BulkAddForm artists={artists} />
}

