import { getAllArtworkMediums } from '@/lib/actions/artwork-medium-actions'
import { getAllArtworkStyles } from '@/lib/actions/artwork-style-actions'
import { getAllArtworkTechniques } from '@/lib/actions/artwork-technique-actions'
import { getAllArtists } from '@/lib/actions/prisma-actions'
import CreateArtworkAdminClient from './CreateArtworkAdminClient'

export default async function CreateArtworkAdminPage() {
  // Récupérer les données de référence en parallèle, incluant les artistes pour les admins
  const [mediums, styles, techniques, artists] = await Promise.all([
    getAllArtworkMediums(),
    getAllArtworkStyles(),
    getAllArtworkTechniques(),
    getAllArtists()
  ])

  return (
    <CreateArtworkAdminClient 
      mediums={mediums}
      styles={styles}
      techniques={techniques}
      artists={artists}
    />
  )
} 