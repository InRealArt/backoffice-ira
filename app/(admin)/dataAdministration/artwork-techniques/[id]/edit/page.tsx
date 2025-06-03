import { notFound } from 'next/navigation'
import { getArtworkTechniqueById } from '@/lib/actions/artwork-technique-actions'
import ArtworkTechniqueForm from '../../components/ArtworkTechniqueForm'

interface EditArtworkTechniquePageProps {
  params: Promise<{ id: string }>
}

export default async function EditArtworkTechniquePage({ params }: EditArtworkTechniquePageProps) {
  const { id } = await params
  const artworkTechniqueId = parseInt(id)
  
  if (isNaN(artworkTechniqueId)) {
    notFound()
  }

  const artworkTechnique = await getArtworkTechniqueById(artworkTechniqueId)
  
  if (!artworkTechnique) {
    notFound()
  }

  return <ArtworkTechniqueForm artworkTechnique={artworkTechnique} />
} 