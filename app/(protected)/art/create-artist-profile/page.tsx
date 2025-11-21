import { getAuthenticatedUserEmail } from '@/lib/auth-helpers'
import CreateArtistProfileForm from './CreateArtistProfileForm'

export default async function CreateArtistProfilePage() {
  // Le proxy garantit que l'utilisateur est authentifié
  // On peut directement récupérer l'email sans vérification supplémentaire
  const userEmail = await getAuthenticatedUserEmail()

  return (
    <div className="page-content">
      <div className="card max-w-5xl mx-auto px-8">
        <div className="card-body">
          <h1 className="page-title">Créer mon profil Artiste</h1>
          <p className="text-muted mb-4">
            Complétez votre profil artiste. Les informations saisies seront utilisées pour créer votre profil sur la plateforme.
          </p>
          <CreateArtistProfileForm userEmail={userEmail} />
        </div>
      </div>
    </div>
  )
}

