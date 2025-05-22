import { Suspense } from 'react'
import { getAllSeoCategories } from '@/lib/actions/seo-category-actions'
import SeoPostForm from '../components/SeoPostForm'

export default async function CreateSeoPostPage() {
  const { categories = [] } = await getAllSeoCategories()
  
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">Créer un nouvel article SEO</h1>
        </div>
        <p className="page-subtitle">
          Créez un nouvel article pour le référencement
        </p>
      </div>
      
      <Suspense fallback={<div>Chargement...</div>}>
        <SeoPostForm categories={categories} />
      </Suspense>
    </div>
  )
} 