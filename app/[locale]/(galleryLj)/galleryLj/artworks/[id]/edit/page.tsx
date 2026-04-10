import GalleryLjArtworkForm from '../../GalleryLjArtworkForm'
import { getGalleryLjArtworkById } from '@/lib/actions/gallery-lj-artwork-actions'
import { notFound } from 'next/navigation'

export const metadata = {
  title: 'Modifier une œuvre Galerie LJ | Administration',
  description: "Modification d'une œuvre de la galerie LJ",
}

interface EditGalleryLjArtworkPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditGalleryLjArtworkPage({ params }: EditGalleryLjArtworkPageProps) {
  const resolvedParams = await params
  const artworkId = parseInt(resolvedParams.id, 10)

  if (isNaN(artworkId)) {
    notFound()
  }

  const artwork = await getGalleryLjArtworkById(artworkId)

  if (!artwork) {
    notFound()
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Modifier une œuvre</h1>
        <p className="page-subtitle">
          Modification de l&apos;œuvre : {artwork.name}
        </p>
      </div>

      <div className="page-content">
        <GalleryLjArtworkForm mode="edit" artworkId={artworkId} />
      </div>
    </div>
  )
}
