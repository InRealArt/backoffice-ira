import ExhibitionForm from '../ExhibitionForm'
import { getAllLandingArtistsForExhibition } from '@/lib/actions/exhibition-actions'

export const metadata = {
  title: 'Nouvelle exposition | Administration',
  description: 'Créer une nouvelle exposition',
}

export default async function CreateExhibitionPage() {
  const artists = await getAllLandingArtistsForExhibition()

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Nouvelle exposition</h1>
        <p className="page-subtitle">Ajoutez une nouvelle exposition au site</p>
      </div>

      <div className="page-content">
        <ExhibitionForm mode="create" artists={artists} />
      </div>
    </div>
  )
}
