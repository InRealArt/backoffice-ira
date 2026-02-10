import { getAllSeoPosts } from '@/lib/actions/seo-post-actions'
import { getAllSeoCategories } from '@/lib/actions/seo-category-actions'
import { getAllLanguages } from '@/lib/services/translation-service'
import SeoPostClient from './SeoPostClient'

export const metadata = {
  title: 'Liste des articles SEO | Landing',
  description: 'Gérez les articles du blog SEO affichés sur le site',
}

// Désactiver le cache pour cette page
export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function SeoPostPage() {
  const [seoPostsResult, languagesResult, categoriesResult] = await Promise.all([
    getAllSeoPosts(),
    getAllLanguages(),
    getAllSeoCategories()
  ])

  const languages = languagesResult
  const categories = (categoriesResult.success ? categoriesResult.categories : undefined) ?? []

  return (
    <SeoPostClient
      seoPosts={seoPostsResult}
      languages={languages}
      categories={categories.map((c) => ({ id: c.id, name: c.name }))}
    />
  )
} 