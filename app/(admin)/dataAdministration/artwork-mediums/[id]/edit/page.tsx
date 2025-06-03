import { getArtworkMediumById } from '@/lib/actions/artwork-medium-actions'
import { notFound } from 'next/navigation'
import ArtworkMediumForm from '../../components/ArtworkMediumForm'

export const metadata = {
  title: 'Modifier un medium d\'œuvre | Data Administration',
  description: 'Modifier les informations d\'un medium d\'œuvre',
}

interface EditArtworkMediumPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditArtworkMediumPage({ params }: EditArtworkMediumPageProps) {
  const { id } = await params
  const artworkMedium = await getArtworkMediumById(parseInt(id))

  if (!artworkMedium) {
    notFound()
  }

  return <ArtworkMediumForm artworkMedium={artworkMedium} />
} 