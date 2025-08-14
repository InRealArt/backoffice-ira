import { getAllArtistCategories } from '@/lib/actions/artist-categories-actions'
import ArtistCategoryClient from './ArtistCategoryClient'

export const metadata = {
  title: 'Liste des catégories d\'artistes | Data Administration',
  description: 'Gérez les catégories d\'artistes utilisées sur le site',
}

export default async function ArtistCategoriesPage() {
  const artistCategories = await getAllArtistCategories()
  return <ArtistCategoryClient artistCategories={artistCategories} />
} 