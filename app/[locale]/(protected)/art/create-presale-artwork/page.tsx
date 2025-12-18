import { getAuthenticatedUserEmail } from '@/lib/auth-helpers'
import { getBackofficeUserByEmail } from '@/lib/actions/prisma-actions'
import { redirect } from 'next/navigation'
import PresaleArtworkForm from '@/app/components/PresaleArtworkForm/PresaleArtworkForm'
import { getTranslations } from 'next-intl/server'

export async function generateMetadata() {
  const t = await getTranslations('art.createPresaleArtworkPage')
  return {
    title: t('title'),
    description: t('description'),
  }
}

export default async function CreatePresaleArtworkPage() {
  const userEmail = await getAuthenticatedUserEmail()
  const t = await getTranslations('art.createPresaleArtworkPage')
  
  // Récupérer l'utilisateur backoffice
  const backofficeUser = await getBackofficeUserByEmail(userEmail)
  
  if (!backofficeUser || !backofficeUser.artistId) {
    // Rediriger vers la page de création si l'utilisateur n'a pas de profil artiste
    redirect('/art/create-artist-profile')
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">{t('pageTitle')}</h1>
        <p className="page-subtitle">
          {t('pageSubtitle')}
        </p>
      </div>
      
      <div className="page-content">
        <PresaleArtworkForm 
          mode="create" 
          defaultArtistId={backofficeUser.artistId}
          redirectUrl="/art/my-artworks"
        />
      </div>
    </div>
  )
}









