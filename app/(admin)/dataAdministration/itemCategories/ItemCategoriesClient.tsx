'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ItemCategory } from '@prisma/client'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { deleteItemCategory } from '@/lib/actions/item-category-actions'
import { useToast } from '@/app/components/Toast/ToastContext'
import {
  PageContainer,
  PageHeader,
  PageContent,
  DataTable,
  EmptyState,
  ActionButton,
  DeleteActionButton,
  Column
} from '../../../components/PageLayout/index'

interface ItemCategoriesClientProps {
  itemCategories: ItemCategory[]
}

export default function ItemCategoriesClient({ itemCategories }: ItemCategoriesClientProps) {
  const router = useRouter()
  const { success, error } = useToast()
  const [loadingCategoryId, setLoadingCategoryId] = useState<number | null>(null)

  const handleCategoryClick = (category: ItemCategory) => {
    setLoadingCategoryId(category.id)
    router.push(`/dataAdministration/itemCategories/${category.id}/edit`)
  }

  const handleAddNewCategory = () => {
    router.push(`/dataAdministration/itemCategories/new`)
  }

  const handleDelete = async (categoryId: number) => {
    try {
      const result = await deleteItemCategory(categoryId)
      
      if (result.success) {
        success('Catégorie supprimée avec succès')
        router.refresh()
      } else {
        error(result.message || 'Une erreur est survenue lors de la suppression')
      }
    } catch (catchError) {
      console.error('Erreur lors de la suppression:', catchError)
      error('Une erreur est survenue lors de la suppression')
    }
  }

  // Définition des colonnes pour le DataTable
  const columns: Column<ItemCategory>[] = [
    {
      key: 'name',
      header: 'Nom',
      render: (category) => (
        <div className="d-flex align-items-center gap-sm">
          {loadingCategoryId === category.id && <LoadingSpinner size="small" message="" inline />}
          <span className={loadingCategoryId === category.id ? 'text-muted' : ''}>
            {category.name}
          </span>
        </div>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '120px',
      render: (category) => (
        <DeleteActionButton
          onDelete={() => handleDelete(category.id)}
          disabled={loadingCategoryId !== null}
          itemName={`la catégorie "${category.name}"`}
          confirmMessage={`Êtes-vous sûr de vouloir supprimer la catégorie "${category.name}" ? Cette action est irréversible.`}
        />
      )
    }
  ]
  
  return (
    <PageContainer>
      <PageHeader 
        title="Catégories d'œuvres"
        subtitle="Liste des catégories d'œuvres enregistrées dans le système"
        actions={
          <ActionButton 
            label="Ajouter une catégorie"
            onClick={handleAddNewCategory}
            size="small"
          />
        }
      />
      
      <PageContent>
        <DataTable
          data={itemCategories}
          columns={columns}
          keyExtractor={(category) => category.id}
          onRowClick={handleCategoryClick}
          isLoading={false}
          loadingRowId={loadingCategoryId}
          emptyState={
            <EmptyState 
              message="Aucune catégorie trouvée"
              action={
                <ActionButton
                  label="Ajouter une catégorie"
                  onClick={handleAddNewCategory}
                  variant="primary"
                />
              }
            />
          }
        />
      </PageContent>
    </PageContainer>
  )
} 