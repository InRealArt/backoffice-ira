import GalleryLjExhibitionForm from '../../GalleryLjExhibitionForm'
import { getGalleryLjExhibitionById } from '@/lib/actions/gallery-lj-exhibition-actions'
import { notFound } from 'next/navigation'

export const metadata = {
  title: 'Modifier une exposition Galerie LJ | Administration',
  description: "Modification d'une exposition de la galerie LJ",
}

interface EditGalleryLjExhibitionPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditGalleryLjExhibitionPage({ params }: EditGalleryLjExhibitionPageProps) {
  const resolvedParams = await params
  const exhibitionId = parseInt(resolvedParams.id, 10)

  if (isNaN(exhibitionId)) {
    notFound()
  }

  const exhibition = await getGalleryLjExhibitionById(exhibitionId)

  if (!exhibition) {
    notFound()
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Modifier une exposition</h1>
        <p className="page-subtitle">
          Modification de l&apos;exposition : {exhibition.name}
        </p>
      </div>

      <div className="page-content">
        <GalleryLjExhibitionForm mode="edit" exhibitionId={exhibitionId} />
      </div>
    </div>
  )
}
