import { getAllSeoCategories } from '@/lib/actions/seo-category-actions'
import SeoCategoriesClient from './SeoCategoriesClient'

export const metadata = {
  title: 'Catégories d\'articles | Administration',
  description: 'Gérez les catégories d\'articles du blog',
}

export default async function SeoCategoriesPage() {
  const categoriesResponse = await getAllSeoCategories()
  
  return <SeoCategoriesClient categories={categoriesResponse.categories} />
} 