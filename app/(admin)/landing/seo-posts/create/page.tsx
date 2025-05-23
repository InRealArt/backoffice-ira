import { Suspense } from 'react'
import { getAllSeoCategories } from '@/lib/actions/seo-category-actions'
import SeoPostForm from '../components/SeoPostForm'
import PageHeader from '../components/PageHeader'

export default async function CreateSeoPostPage() {
  const { categories = [] } = await getAllSeoCategories()
  
  return (
    <div className="page-container">
      <PageHeader title="Créer un nouvel article SEO" />
      <p className="page-subtitle">
        Créez un nouvel article pour le référencement
      </p>
      
      <Suspense fallback={<div>Chargement...</div>}>
        <SeoPostForm categories={categories} />
      </Suspense>
    </div>
  )
} 