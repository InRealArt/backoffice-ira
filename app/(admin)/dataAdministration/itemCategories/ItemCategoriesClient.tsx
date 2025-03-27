'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ItemCategory } from '@prisma/client'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { deleteItemCategory } from '@/lib/actions/item-category-actions'
import { toast } from 'react-hot-toast'
import Modal from '@/app/components/Common/Modal'

interface ItemCategoriesClientProps {
  itemCategories: ItemCategory[]
}

export default function ItemCategoriesClient({ itemCategories }: ItemCategoriesClientProps) {
  const router = useRouter()
  const [loadingCategoryId, setLoadingCategoryId] = useState<number | null>(null)
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<number | null>(null)

  const handleCategoryClick = (categoryId: number) => {
    setLoadingCategoryId(categoryId)
    router.push(`/dataAdministration/itemCategories/${categoryId}/edit`)
  }

  const handleAddNewCategory = () => {
    router.push(`/dataAdministration/itemCategories/new`)
  }

  const handleDeleteClick = (e: React.MouseEvent, categoryId: number) => {
    e.stopPropagation() // Empêche le déclenchement du click sur la ligne
    setCategoryToDelete(categoryId)
    setIsDeleteModalOpen(true)
  }
  
  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return
    
    setIsDeleteModalOpen(false)
    setDeletingCategoryId(categoryToDelete)
    
    try {
      const result = await deleteItemCategory(categoryToDelete)
      
      if (result.success) {
        toast.success('Catégorie supprimée avec succès')
        router.refresh()
      } else {
        toast.error(result.message || 'Une erreur est survenue lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      toast.error('Une erreur est survenue lors de la suppression')
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
          <h1 className="page-title">Catégories d'œuvres</h1>
          <button 
            className="btn btn-primary btn-small"
            onClick={handleAddNewCategory}
          >
            Ajouter une catégorie
          </button>
        </div>
        <p className="page-subtitle">
          Liste des catégories d'œuvres enregistrées dans le système
        </p>
      </div>
      
      <div className="page-content">
        {itemCategories.length === 0 ? (
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
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {itemCategories.map((category) => {
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
                      <td className="text-right">
                        <button
                          onClick={(e) => handleDeleteClick(e, category.id)}
                          className="btn btn-danger btn-small"
                          disabled={isDisabled}
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
      
      {/* Modal de confirmation de suppression */}
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