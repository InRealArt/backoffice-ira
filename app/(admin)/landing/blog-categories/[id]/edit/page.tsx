import { getSeoCategoryById } from '@/lib/actions/seo-category-actions'
import SeoCategoryForm from '../../SeoCategoryForm'
import { notFound } from 'next/navigation'

export const metadata = {
  title: 'Modifier une catégorie | Administration',
  description: 'Modifier une catégorie d\'articles existante',
}

interface PageParams {
  params: Promise<{id: string}>
}

export default async function EditSeoCategoryPage({ params }: PageParams) {
    const { id } = await params
  
  if (isNaN(parseInt(id))) {
    notFound()
  }
  
  const category = await getSeoCategoryById(parseInt(id))
  
  if (!category) {
    notFound()
  }
  
  return <SeoCategoryForm category={category} isEditing={true} />
} 