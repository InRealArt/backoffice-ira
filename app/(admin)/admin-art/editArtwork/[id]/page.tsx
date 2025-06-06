import { getAllArtworkMediums } from '@/lib/actions/artwork-medium-actions'
import { getAllArtworkStyles } from '@/lib/actions/artwork-style-actions'
import { getAllArtworkTechniques } from '@/lib/actions/artwork-technique-actions'
import { getAllArtists, getItemById } from '@/lib/actions/prisma-actions'

import { notFound } from 'next/navigation'
import EditArtworkAdminClient from './EditArtworkAdminClient'

interface EditArtworkAdminPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditArtworkAdminPage({ params }: EditArtworkAdminPageProps) {
  const itemId = parseInt((await params).id)
  
  if (isNaN(itemId)) {
    notFound()
  }

  // Récupérer les données en parallèle
  const [mediums, styles, techniques, artists, item] = await Promise.all([
    getAllArtworkMediums(),
    getAllArtworkStyles(),
    getAllArtworkTechniques(),
    getAllArtists(),
    getItemById(itemId)
  ])

  if (!item) {
    notFound()
  }

  return (
    <EditArtworkAdminClient
      mediums={mediums}
      styles={styles}
      techniques={techniques}
      artists={artists}
      item={item}
    />
  )
} 