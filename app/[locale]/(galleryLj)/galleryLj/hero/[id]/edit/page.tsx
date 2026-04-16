import GalleryLjHeroForm from '../../GalleryLjHeroForm'
import { getGalleryLjHeroById } from '@/lib/actions/gallery-lj-hero-actions'
import { notFound } from 'next/navigation'

export const metadata = {
  title: 'Modifier un héro Galerie LJ | Administration',
  description: "Modification d'un héro de la galerie LJ",
}

interface EditGalleryLjHeroPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditGalleryLjHeroPage({ params }: EditGalleryLjHeroPageProps) {
  const resolvedParams = await params
  const heroId = parseInt(resolvedParams.id, 10)

  if (isNaN(heroId)) {
    notFound()
  }

  const hero = await getGalleryLjHeroById(heroId)

  if (!hero) {
    notFound()
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Modifier un héro</h1>
        <p className="page-subtitle">
          Modification du héro : {hero.title}
        </p>
      </div>

      <div className="page-content">
        <GalleryLjHeroForm mode="edit" heroId={heroId} />
      </div>
    </div>
  )
}
