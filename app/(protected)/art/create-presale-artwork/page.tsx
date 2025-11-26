import { getAuthenticatedUserEmail } from '@/lib/auth-helpers'
import { getBackofficeUserByEmail } from '@/lib/actions/prisma-actions'
import { redirect } from 'next/navigation'
import PresaleArtworkForm from '@/app/components/PresaleArtworkForm/PresaleArtworkForm'

export const metadata = {
  title: 'Créer une œuvre en prévente | Site web InRealArt',
  description: 'Créez une nouvelle œuvre en prévente',
}

export default async function CreatePresaleArtworkPage() {
  const userEmail = await getAuthenticatedUserEmail()
  
  // Récupérer l'utilisateur backoffice
  const backofficeUser = await getBackofficeUserByEmail(userEmail)
  
  if (!backofficeUser || !backofficeUser.artistId) {
    // Rediriger vers la page de création si l'utilisateur n'a pas de profil artiste
    redirect('/art/create-artist-profile')
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Créer une œuvre en prévente</h1>
        <p className="page-subtitle">
          Ajoutez une nouvelle œuvre en prévente pour le site web InRealArt
        </p>
      </div>
      
      <div className="page-content">
        <PresaleArtworkForm 
          mode="create" 
          defaultArtistId={backofficeUser.artistId}
          redirectUrl="/art/presale-artworks"
        />
      </div>
    </div>
  )
}







