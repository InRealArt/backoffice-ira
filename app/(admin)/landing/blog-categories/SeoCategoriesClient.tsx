'use client'

import { useState } from 'react'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { useCategories } from './hooks/useCategories'
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

interface CategoryProps {
  id: number
  name: string
  url?: string | null
  color?: string | null
  shortDescription?: string | null
  _count?: { posts: number }
}

interface SeoCategoriesClientProps {
  categories: CategoryProps[] | undefined
}

export default function SeoCategoriesClient({ categories: initialCategories }: SeoCategoriesClientProps) {
  const {
    categories,
    loadingCategoryId,
    navigateToEdit,
    navigateToCreate,
    deleteCategory,
    isLoading
  } = useCategories({ initialCategories })

  const handleCategoryClick = (category: CategoryProps) => {
    if (!isLoading) {
      navigateToEdit(category.id)
    }
  }

  const handleDelete = async (categoryId: number) => {
    await deleteCategory(categoryId)
  }

  // Définition des colonnes pour le DataTable
  const columns: Column<CategoryProps>[] = [
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
      key: 'url',
      header: 'URL',
      render: (category) => category.url || '-'
    },
    {
      key: 'color',
      header: 'Couleur',
      width: '100px',
      render: (category) => (
        category.color ? (
          <div 
            className="color-preview" 
            style={{ 
              backgroundColor: category.color,
              width: '24px',
              height: '24px',
              borderRadius: '4px',
              display: 'inline-block',
              border: '1px solid #e5e7eb'
            }} 
          />
        ) : '-'
      )
    },
    {
      key: 'posts',
      header: 'Articles',
      width: '100px',
      render: (category) => category._count?.posts || 0
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '120px',
      render: (category) => (
        <DeleteActionButton
          onDelete={() => handleDelete(category.id)}
          disabled={isLoading || (category._count?.posts || 0) > 0}
          itemName={`la catégorie "${category.name}"`}
          confirmMessage={`Êtes-vous sûr de vouloir supprimer la catégorie "${category.name}" ? Cette action est irréversible.`}
        />
      )
    }
  ]
  
  return (
    <PageContainer>
      <PageHeader 
        title="Catégories d'articles"
        subtitle="Gérez les catégories d'articles du blog"
        actions={
          <ActionButton 
            label="Ajouter une catégorie"
            onClick={navigateToCreate}
            size="small"
          />
        }
      />
      
      <PageContent>
        <DataTable
          data={categories || []}
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
                  onClick={navigateToCreate}
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