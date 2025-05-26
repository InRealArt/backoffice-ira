'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { useToast } from '@/app/components/Toast/ToastContext'
import Modal from '@/app/components/Common/Modal'
import { deleteSeoCategory } from '@/lib/actions/seo-category-actions'

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

/**
 * @deprecated Utiliser SeoCategoriesClientWithHook à la place
 * Version legacy conservée pour référence
 */
export default function SeoCategoriesClientLegacy({ categories: initialCategories }: SeoCategoriesClientProps) {
  const router = useRouter()
  const [categories, setCategories] = useState<CategoryProps[] | undefined>(initialCategories)
  const [loadingCategoryId, setLoadingCategoryId] = useState<number | null>(null)
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null)
  const { success, error } = useToast()
  // Synchroniser avec les nouvelles props quand elles changent
  useEffect(() => {
    setCategories(initialCategories)
  }, [initialCategories])

  const handleCategoryClick = (categoryId: number) => {
    setLoadingCategoryId(categoryId)
    router.push(`/landing/blog-categories/${categoryId}/edit`)
  }

  const handleAddNewCategory = () => {
    router.push(`/landing/blog-categories/create`)
  }

  const handleDeleteClick = (e: React.MouseEvent, categoryId: number) => {
    e.stopPropagation()
    setCategoryToDelete(categoryId)
    setIsDeleteModalOpen(true)
  }
  
  const handleDeleteConfirm = async () => {
    if (!categoryToDelete || !categories) return
    
    setIsDeleteModalOpen(false)
    setDeletingCategoryId(categoryToDelete)
    
    try {
      const result = await deleteSeoCategory(categoryToDelete)
      
      if (result.success) {
        // Mise à jour optimiste : supprimer immédiatement de l'état local
        setCategories(prevCategories => 
          prevCategories?.filter(category => category.id !== categoryToDelete)
        )
        success('Catégorie supprimée avec succès')
        
        // Rafraîchir en arrière-plan pour s'assurer de la synchronisation
        router.refresh()
      } else {
        error(result.message || 'Une erreur est survenue lors de la suppression')
      }
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error)
      error('Une erreur est survenue lors de la suppression')
      
      // En cas d'erreur, rafraîchir pour restaurer l'état correct
      router.refresh()
    } finally {
      setDeletingCategoryId(null)
      setCategoryToDelete(null)
    }
  }
  
  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false)
    setCategoryToDelete(null)
  }
  
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">Catégories d'articles</h1>
          <button 
            className="btn btn-primary btn-small"
            onClick={handleAddNewCategory}
          >
            Ajouter une catégorie
          </button>
        </div>
        <p className="page-subtitle">
          Gérez les catégories d'articles du blog
        </p>
      </div>
      
      <div className="page-content">
        {categories && categories.length === 0 ? (
          <div className="empty-state">
            <p>Aucune catégorie trouvée</p>
            <button 
              className="btn btn-primary btn-medium mt-4"
              onClick={handleAddNewCategory}
            >
              Ajouter une catégorie
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>URL</th>
                  <th>Couleur</th>
                  <th>Articles</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories && categories.map((category) => {
                  const isLoading = loadingCategoryId === category.id
                  const isDeleting = deletingCategoryId === category.id
                  const isDisabled = loadingCategoryId !== null || deletingCategoryId !== null
                  
                  return (
                    <tr 
                      key={category.id} 
                      onClick={() => !isDisabled && handleCategoryClick(category.id)}
                      className={`clickable-row ${isLoading || isDeleting ? 'loading-row' : ''} ${isDisabled && !isLoading && !isDeleting ? 'disabled-row' : ''}`}
                    >
                      <td>
                        <div className="d-flex align-items-center gap-sm">
                          {isLoading && <LoadingSpinner size="small" message="" inline />}
                          <span className={isLoading ? 'text-muted' : ''}>
                            {category.name}
                          </span>
                        </div>
                      </td>
                      <td>
                        {category.url || '-'}
                      </td>
                      <td>
                        {category.color ? (
                          <div className="color-preview" style={{ 
                            backgroundColor: category.color,
                            width: '24px',
                            height: '24px',
                            borderRadius: '4px',
                            display: 'inline-block'
                          }} />
                        ) : '-'}
                      </td>
                      <td>
                        {category._count?.posts || 0}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={(e) => handleDeleteClick(e, category.id)}
                          className="btn btn-danger btn-small"
                          disabled={isDisabled || (category._count?.posts || 0) > 0}
                          title={category._count?.posts && category._count.posts > 0 ? 'Impossible de supprimer une catégorie contenant des articles' : ''}
                        >
                          {isDeleting ? (
                            <LoadingSpinner size="small" message="" inline />
                          ) : (
                            'Supprimer'
                          )}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        title="Confirmation de suppression"
      >
        <div className="modal-content">
          <p className="text-danger">
            Êtes-vous sûr de vouloir supprimer cette catégorie ? Cette action est irréversible.
          </p>
          
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={handleDeleteCancel}>
              Annuler
            </button>
            <button className="btn btn-danger" onClick={handleDeleteConfirm}>
              Confirmer la suppression
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
} 