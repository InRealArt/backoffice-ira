import GalleryLjHeroForm from '../GalleryLjHeroForm'
import { getAllGalleryLjHeroes } from '@/lib/actions/gallery-lj-hero-actions'

export const metadata = {
  title: 'Nouveau héro Galerie LJ | Administration',
  description: 'Ajoutez un nouveau héro à la galerie LJ',
}

export default async function CreateGalleryLjHeroPage() {
  const heroes = await getAllGalleryLjHeroes()
  const hasReachedHeroLimit = heroes.length >= 1

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Nouveau héro</h1>
        <p className="page-subtitle">
          Ajoutez une section hero à la galerie LJ
        </p>
      </div>
      <div className="page-content">
        <GalleryLjHeroForm mode="create" hasReachedHeroLimit={hasReachedHeroLimit} />
      </div>
    </div>
  )
}
