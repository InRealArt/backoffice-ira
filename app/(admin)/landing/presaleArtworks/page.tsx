import { getAllPresaleArtworks } from '@/lib/actions/presale-artwork-actions'
import PresaleArtworksClient from './PresaleArtworksClient'

export const metadata = {
  title: 'Liste des œuvres en prévente | Administration',
  description: 'Gérez les œuvres en prévente',
}

export default async function PresaleArtworksPage() {
  const presaleArtworks = await getAllPresaleArtworks()

  return <PresaleArtworksClient presaleArtworks={presaleArtworks} />
} 