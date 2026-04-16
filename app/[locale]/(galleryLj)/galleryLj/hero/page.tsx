import { getAllGalleryLjHeroes } from '@/lib/actions/gallery-lj-hero-actions'
import GalleryLjHeroClient from './GalleryLjHeroClient'

export const metadata = {
  title: 'Hero Galerie LJ | Administration',
  description: 'Gérez les sections hero de la galerie LJ',
}

export default async function GalleryLjHeroPage() {
  const heroes = await getAllGalleryLjHeroes()

  return (
    <GalleryLjHeroClient heroes={heroes} />
  )
}
