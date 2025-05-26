import { getAllSeoPosts } from '@/lib/actions/seo-post-actions'
import SeoPostClient from './SeoPostClient'

export const metadata = {
  title: 'Liste des articles SEO | Landing',
  description: 'Gérez les articles du blog SEO affichés sur le site',
}

// Désactiver le cache pour cette page
export const revalidate = 0
export const dynamic = 'force-dynamic'

export default async function SeoPostPage() {
  const seoPosts = await getAllSeoPosts()
  return <SeoPostClient seoPosts={seoPosts} />
} 