import PresaleArtworkForm from '../../PresaleArtworkForm'
import { getPresaleArtworkById } from '@/lib/actions/presale-artwork-actions'
import { notFound } from 'next/navigation'

export const metadata = {
  title: 'Modifier une œuvre en prévente | Administration',
  description: 'Modification d\'une œuvre en prévente existante',
}

interface EditPresaleArtworkPageProps {
  params: {
    id: string
  }
}

export default async function EditPresaleArtworkPage({ params }: EditPresaleArtworkPageProps) {
  const presaleArtworkId = parseInt(params.id, 10)
  
  if (isNaN(presaleArtworkId)) {
    notFound()
  }
  
  const presaleArtwork = await getPresaleArtworkById(presaleArtworkId)
  
  if (!presaleArtwork) {
    notFound()
  }
  
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Modifier une œuvre en prévente</h1>
        <p className="page-subtitle">
          Modification de l'œuvre: {presaleArtwork.name}
        </p>
      </div>
      
      <div className="page-content">
        <PresaleArtworkForm mode="edit" presaleArtworkId={presaleArtworkId} />
      </div>
    </div>
  )
} 