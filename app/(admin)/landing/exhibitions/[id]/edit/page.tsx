import { notFound } from 'next/navigation'
import {
  getExhibitionById,
  getAllLandingArtistsForExhibition,
  getExhibitionArtistIds,
} from '@/lib/actions/exhibition-actions'
import ExhibitionForm from '../../ExhibitionForm'

export const metadata = {
  title: 'Modifier une exposition | Administration',
  description: "Modification d'une exposition existante",
}

interface EditExhibitionPageProps {
  params: Promise<{ id: string }>
}

export default async function EditExhibitionPage({ params }: EditExhibitionPageProps) {
  const { id } = await params
  const exhibitionId = parseInt(id, 10)

  if (isNaN(exhibitionId)) {
    notFound()
  }

  const [exhibition, artists, initialArtistIds] = await Promise.all([
    getExhibitionById(exhibitionId),
    getAllLandingArtistsForExhibition(),
    getExhibitionArtistIds(exhibitionId),
  ])

  if (!exhibition) {
    notFound()
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Modifier une exposition</h1>
        <p className="page-subtitle">Modification de : {exhibition.name}</p>
      </div>

      <div className="page-content">
        <ExhibitionForm
          mode="edit"
          exhibition={exhibition}
          artists={artists}
          initialArtistIds={initialArtistIds}
        />
      </div>
    </div>
  )
}
