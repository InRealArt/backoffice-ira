import GalleryLjArtistForm from '../../GalleryLjArtistForm'
import { getGalleryLjArtistById } from '@/lib/actions/gallery-lj-artist-actions'
import { notFound } from 'next/navigation'

export const metadata = {
  title: 'Modifier un artiste Galerie LJ | Administration',
  description: "Modification d'un artiste de la galerie LJ",
}

interface EditGalleryLjArtistPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditGalleryLjArtistPage({ params }: EditGalleryLjArtistPageProps) {
  const resolvedParams = await params
  const artistId = parseInt(resolvedParams.id, 10)

  if (isNaN(artistId)) {
    notFound()
  }

  const artist = await getGalleryLjArtistById(artistId)

  if (!artist) {
    notFound()
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Modifier un artiste</h1>
        <p className="page-subtitle">
          Modification de l&apos;artiste : {artist.pseudo}
        </p>
      </div>

      <div className="page-content">
        <GalleryLjArtistForm mode="edit" artistId={artistId} />
      </div>
    </div>
  )
}
