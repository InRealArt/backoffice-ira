import { getAllArtworkTechniques } from '@/lib/actions/artwork-technique-actions'
import ArtworkTechniqueClient from './ArtworkTechniqueClient'

export const metadata = {
  title: 'Liste des techniques d\'œuvres | Data Administration',
  description: 'Gérez les techniques d\'œuvres utilisées sur le site',
}

export default async function ArtworkTechniquesPage() {
  const artworkTechniques = await getAllArtworkTechniques()
  return <ArtworkTechniqueClient artworkTechniques={artworkTechniques} />
} 