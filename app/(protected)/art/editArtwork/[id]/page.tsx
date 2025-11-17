import { getAllArtworkMediums } from '@/lib/actions/artwork-medium-actions'
import { getAllArtworkStyles } from '@/lib/actions/artwork-style-actions'
import { getAllArtworkTechniques } from '@/lib/actions/artwork-technique-actions'
import { getAllArtworkThemes } from '@/lib/actions/artwork-theme-actions'
import EditArtworkClient from './EditArtworkClient'

export default async function EditArtworkPage({ params }: { params: Promise<{ id: string }> }) {
  // Récupérer les données de référence en parallèle
  const [mediums, styles, techniques, themes] = await Promise.all([
    getAllArtworkMediums(),
    getAllArtworkStyles(),
    getAllArtworkTechniques(),
    getAllArtworkThemes()
  ])

  return (
    <EditArtworkClient 
      params={params}
      mediums={mediums}
      styles={styles}
      techniques={techniques}
      themes={themes}
    />
  )
} 