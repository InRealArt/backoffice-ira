import { getAllArtworkMediums } from '@/lib/actions/artwork-medium-actions'
import { getAllArtworkStyles } from '@/lib/actions/artwork-style-actions'
import { getAllArtworkTechniques } from '@/lib/actions/artwork-technique-actions'
import CreateArtworkClient from './CreateArtworkClient'

export default async function CreateArtworkPage() {
  // Récupérer les données de référence en parallèle
  const [mediums, styles, techniques] = await Promise.all([
    getAllArtworkMediums(),
    getAllArtworkStyles(),
    getAllArtworkTechniques()
  ])

  return (
    <CreateArtworkClient 
      mediums={mediums}
      styles={styles}
      techniques={techniques}
    />
  )
} 