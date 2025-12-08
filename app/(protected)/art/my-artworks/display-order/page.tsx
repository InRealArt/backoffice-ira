import { getAuthenticatedUserEmail } from '@/lib/auth-helpers'
import { getBackofficeUserByEmail } from '@/lib/actions/prisma-actions'
import { redirect } from 'next/navigation'
import { getAllPresaleArtworks } from '@/lib/actions/presale-artwork-actions'
import DisplayOrderManager from '../DisplayOrderManager'

export const metadata = {
  title: 'Ordre d\'affichage | Mes œuvres',
  description: 'Réorganisez l\'ordre d\'affichage de vos œuvres',
}

export default async function DisplayOrderPage() {
  const userEmail = await getAuthenticatedUserEmail()

  // Récupérer l'utilisateur backoffice
  const backofficeUser = await getBackofficeUserByEmail(userEmail)

  if (!backofficeUser || !backofficeUser.artistId) {
    // Rediriger vers la page de création si l'utilisateur n'a pas de profil artiste
    redirect('/art/create-artist-profile')
  }

  const artistId = backofficeUser.artistId

  // Récupérer toutes les œuvres
  const presaleArtworksData = await getAllPresaleArtworks()

  // Filtrer uniquement les œuvres de l'artiste connecté
  const filteredArtworks = presaleArtworksData.filter(
    (artwork) => artwork.artistId === artistId
  )

  return (
    <div className="page-container">
      <DisplayOrderManager
        artworks={filteredArtworks}
        artistId={artistId}
      />
    </div>
  )
}




