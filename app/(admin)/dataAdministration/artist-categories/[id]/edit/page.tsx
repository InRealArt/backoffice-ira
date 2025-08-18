import { getArtistCategoryById } from '@/lib/actions/artist-categories-actions'
import { notFound } from 'next/navigation'
import ArtistCategoryForm from '../../components/ArtistCategoryForm'

export const metadata = {
  title: 'Modifier une catégorie d\'artiste | Data Administration',
  description: 'Modifier les informations d\'une catégorie d\'artiste',
}

interface EditArtistCategoryPageProps {
  params: Promise<{
    id: string
  }>
}

  export default async function EditArtistCategoryPage({ params }: EditArtistCategoryPageProps) {
    const { id } = await params
  const artistCategory = await getArtistCategoryById(parseInt(id))

  if (!artistCategory) {
    notFound()
  }

  return <ArtistCategoryForm artistCategory={artistCategory} />
} 