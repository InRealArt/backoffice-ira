import { Suspense } from 'react'
import { getAllSeoCategories } from '@/lib/actions/seo-category-actions'
import { getSeoPostById } from '@/lib/actions/seo-post-actions'
import SeoPostForm from '../../components/SeoPostForm'
import PageHeader from '../../components/PageHeader'
import { notFound } from 'next/navigation'

interface EditSeoPostPageProps {
  params: {
    id: string
  }
}

export default async function EditSeoPostPage({ params }: EditSeoPostPageProps) {
  const seoPostId = parseInt(params.id)
  
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
      <p className="page-subtitle">
        Modifier "{seoPost.title}"
      </p>
      
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