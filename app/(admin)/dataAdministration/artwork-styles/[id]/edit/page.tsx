import { notFound } from 'next/navigation'
import { getArtworkStyleById } from '@/lib/actions/artwork-style-actions'
import ArtworkStyleForm from '../../components/ArtworkStyleForm'

interface EditArtworkStylePageProps {
  params: Promise<{ id: string }>
}

export default async function EditArtworkStylePage({ params }: EditArtworkStylePageProps) {
  const { id } = await params
  const artworkStyleId = parseInt(id)
  
  // if (isNaN(id)) {
  //   notFound()
  // }

  const artworkStyle = await getArtworkStyleById(artworkStyleId)
  
  if (!artworkStyle) {
    notFound()
  }

  return <ArtworkStyleForm artworkStyle={artworkStyle} />
} 