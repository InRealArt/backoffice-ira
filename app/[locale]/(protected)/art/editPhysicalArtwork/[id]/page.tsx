import { getAllArtworkMediums } from '@/lib/actions/artwork-medium-actions'
import { getAllArtworkStyles } from '@/lib/actions/artwork-style-actions'
import { getAllArtworkTechniques } from '@/lib/actions/artwork-technique-actions'
import { getAllArtworkThemes } from '@/lib/actions/artwork-theme-actions'
import { getAllArtworkSupports } from '@/lib/actions/artwork-support-actions'
import EditPhysicalArtworkClient from './EditPhysicalArtworkClient'


export default async function EditPhysicalArtworkPage({ params }: { params: Promise<{ id: string }> }) {
  // Récupérer les données de référence en parallèle
  const [mediums, styles, techniques, themes, supports] = await Promise.all([
    getAllArtworkMediums(),
    getAllArtworkStyles(),
    getAllArtworkTechniques(),
    getAllArtworkThemes(),
    getAllArtworkSupports()
  ])

  return (
    <EditPhysicalArtworkClient 
      params={params}
      mediums={mediums} 
      styles={styles}
      techniques={techniques}
      themes={themes}
      supports={supports}
    />
  )
} 