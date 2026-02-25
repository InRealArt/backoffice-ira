import { Suspense } from 'react'
import Link from 'next/link'
import { getAllSeoCategories } from '@/lib/actions/seo-category-actions'
import { getSeoPostsForRelatedSelector } from '@/lib/actions/seo-post-actions'
import SeoPostForm from '../components/SeoPostForm'
import PageHeader from '../components/PageHeader'

export default async function CreateSeoPostPage() {
  const [{ categories = [] }, availablePosts] = await Promise.all([
    getAllSeoCategories(),
    getSeoPostsForRelatedSelector()
  ])

  return (
    <div className="page-container">
      <PageHeader title="Créer un nouvel article SEO" />
      <p className="page-subtitle">
        Créez un nouvel article pour le référencement
      </p>
      <p className="text-sm text-text-secondary mb-4">
        Vous avez un fichier Word ?{' '}
        <Link href="/landing/seo-posts/import" className="link">
          Importer depuis un fichier DOCX →
        </Link>
      </p>

      <Suspense fallback={<div>Chargement...</div>}>
        <SeoPostForm categories={categories} availablePosts={availablePosts} />
      </Suspense>
    </div>
  )
} 