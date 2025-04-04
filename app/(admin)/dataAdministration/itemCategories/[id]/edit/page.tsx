import { notFound } from 'next/navigation'
import { getItemCategoryById } from '@/lib/actions/item-category-actions'
import ItemCategoryEditForm from './ItemCategoryEditForm'

export default async function EditItemCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const { id } = resolvedParams
  const categoryId = parseInt(id)
  
  if (isNaN(categoryId)) {
    notFound()
  }
  
  const itemCategory = await getItemCategoryById(categoryId)
  
  if (!itemCategory) {
    notFound()
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Modifier la catégorie</h1>
      <ItemCategoryEditForm itemCategory={itemCategory} />
    </div>
  )
} 