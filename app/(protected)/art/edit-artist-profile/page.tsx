import { getAuthenticatedUserEmail } from '@/lib/auth-helpers'
import { getBackofficeUserByEmail, getArtistById } from '@/lib/actions/prisma-actions'
import { getLandingArtistByArtistId } from '@/lib/actions/artist-actions'
import { notFound, redirect } from 'next/navigation'
import EditArtistProfileForm from './EditArtistProfileForm'

export default async function EditArtistProfilePage() {
  const userEmail = await getAuthenticatedUserEmail()
  
  // Récupérer l'utilisateur backoffice
  const backofficeUser = await getBackofficeUserByEmail(userEmail)
  
  if (!backofficeUser || !backofficeUser.artistId) {
    // Rediriger vers la page de création si l'utilisateur n'a pas de profil artiste
    redirect('/art/create-artist-profile')
  }

  // Récupérer l'artiste et le LandingArtist
  const [artist, landingArtist] = await Promise.all([
    getArtistById(backofficeUser.artistId),
    getLandingArtistByArtistId(backofficeUser.artistId)
  ])

  if (!artist) {
    notFound()
  }

  return (
    <div className="page-content">
      <div className="card max-w-5xl mx-auto px-8">
        <div className="card-body">
          <h1 className="page-title">Modifier mon profil Artiste</h1>
          <p className="text-muted mb-4">
            Modifiez les informations de votre profil artiste. Les champs prénom et nom ne peuvent pas être modifiés.
          </p>
          <EditArtistProfileForm artist={artist} landingArtist={landingArtist} />
        </div>
      </div>
    </div>
  )
}



