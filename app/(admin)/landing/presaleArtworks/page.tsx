import { getAllPresaleArtworks } from '@/lib/actions/presale-artwork-actions'
import PresaleArtworksClient from './PresaleArtworksClient'

export const metadata = {
  title: 'Liste des œuvres en prévente | Administration',
  description: 'Gérez les œuvres en prévente',
}

export default async function PresaleArtworksPage() {
  const presaleArtworksData = await getAllPresaleArtworks()
  
  // Transformer les données pour s'assurer que 'order' est toujours un nombre
  const presaleArtworks = presaleArtworksData.map(artwork => ({
    ...artwork,
    order: artwork.order ?? 0 // Utiliser 0 comme valeur par défaut si null
  }))

  return <PresaleArtworksClient presaleArtworks={presaleArtworks} />
} 