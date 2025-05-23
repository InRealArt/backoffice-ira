import { Suspense } from 'react'
import { getAllSeoCategories } from '@/lib/actions/seo-category-actions'
import { getSeoPostById } from '@/lib/actions/seo-post-actions'
import SeoPostForm from '../../components/SeoPostForm'
import PageHeader from '../../components/PageHeader'
import { notFound } from 'next/navigation'

interface EditSeoPostPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditSeoPostPage({ params }: EditSeoPostPageProps) {
  const { id } = await params
  const seoPostId = parseInt(id)
  
  if (isNaN(seoPostId)) {
    return notFound()
  }
  
  const [seoPost, categoriesResult] = await Promise.all([
    getSeoPostById(seoPostId),
    getAllSeoCategories()
  ])
  
  if (!seoPost) {
    return notFound()
  }
  
  const { categories = [] } = categoriesResult
  
  return (
    <div className="page-container">
      <PageHeader title="Modifier l'article SEO" />
      
      <div className="flex items-start gap-3 mb-6">
        <p className="page-subtitle">
          Modifier "{seoPost.title}"
        </p>
        <div className="flex flex-col items-start gap-2">
          <span className={`status-badge ${
            seoPost.status === 'PUBLISHED' ? 'status-success' : 'status-warning'
          }`}>
            {seoPost.status === 'PUBLISHED' ? 'PUBLIÉ' : 'BROUILLON'}
          </span>
          
          {seoPost.pinned && (
            <div className="flex items-center gap-1 text-xs text-gray-600">
              <svg 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="text-blue-600"
              >
                <path d="M12 17v5" />
                <path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 7.89 17H16.1a2 2 0 0 0 1.78-2.55l-1.78-.9A2 2 0 0 1 15 10.76V7a1 1 0 0 0-1-1H10a1 1 0 0 0-1 1z" />
              </svg>
              <span className="font-medium text-blue-600">Épinglé</span>
            </div>
          )}
        </div>
      </div>
      
      <Suspense fallback={<div>Chargement...</div>}>
        <SeoPostForm 
          categories={categories} 
          seoPost={seoPost} 
          isEditing={true} 
        />
      </Suspense>
    </div>
  )
} 