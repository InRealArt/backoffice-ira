'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Language } from '@prisma/client'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { deleteLanguage } from '@/lib/actions/language-actions'
import { toast } from 'react-hot-toast'
import Modal from '@/app/components/Common/Modal'

interface LanguagesClientProps {
  languages: Language[]
}

export default function LanguagesClient({ languages }: LanguagesClientProps) {
  const router = useRouter()
  const [loadingLanguageId, setLoadingLanguageId] = useState<number | null>(null)
  const [deletingLanguageId, setDeletingLanguageId] = useState<number | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [languageToDelete, setLanguageToDelete] = useState<number | null>(null)

  const handleLanguageClick = (languageId: number) => {
    setLoadingLanguageId(languageId)
    router.push(`/landing/languages/${languageId}/edit`)
  }

  const handleAddNewLanguage = () => {
    router.push(`/landing/languages/new`)
  }

  const handleDeleteClick = (e: React.MouseEvent, languageId: number) => {
    e.stopPropagation() // Empêche le déclenchement du click sur la ligne
    setLanguageToDelete(languageId)
    setIsDeleteModalOpen(true)
  }
  
  const handleDeleteConfirm = async () => {
    if (!languageToDelete) return
    
    setIsDeleteModalOpen(false)
    setDeletingLanguageId(languageToDelete)
    
    try {
      const result = await deleteLanguage(languageToDelete)
      
      if (result.success) {
        toast.success('Langue supprimée avec succès')
        router.refresh()
      } else {
        toast.error(result.message || 'Une erreur est survenue lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      toast.error('Une erreur est survenue lors de la suppression')
    } finally {
      setDeletingLanguageId(null)
      setLanguageToDelete(null)
    }
  }
  
  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false)
    setLanguageToDelete(null)
  }
  
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">Langues</h1>
          <button 
            className="btn btn-primary btn-small"
            onClick={handleAddNewLanguage}
          >
            Ajouter une langue
          </button>
        </div>
        <p className="page-subtitle">
          Liste des langues disponibles pour le contenu multilingue
        </p>
      </div>
      
      <div className="page-content">
        {languages.length === 0 ? (
          <div className="empty-state">
            <p>Aucune langue trouvée</p>
            <button 
              className="btn btn-primary btn-medium mt-4"
              onClick={handleAddNewLanguage}
            >
              Ajouter une langue
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Code</th>
                  <th>Par défaut</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {languages.map((language) => {
                  const isLoading = loadingLanguageId === language.id
                  const isDeleting = deletingLanguageId === language.id
                  const isDisabled = loadingLanguageId !== null || deletingLanguageId !== null
                  
                  return (
                    <tr 
                      key={language.id} 
                      onClick={() => !isDisabled && handleLanguageClick(language.id)}
                      className={`clickable-row ${isLoading || isDeleting ? 'loading-row' : ''} ${isDisabled && !isLoading && !isDeleting ? 'disabled-row' : ''}`}
                    >
                      <td>
                        <div className="d-flex align-items-center gap-sm">
                          {isLoading && <LoadingSpinner size="small" message="" inline />}
                          <span className={isLoading ? 'text-muted' : ''}>
                            {language.name}
                          </span>
                        </div>
                      </td>
                      <td>{language.code}</td>
                      <td>
                        {language.isDefault ? (
                          <span className="badge badge-success">Oui</span>
                        ) : (
                          <span className="badge badge-secondary">Non</span>
                        )}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={(e) => handleDeleteClick(e, language.id)}
                          className="btn btn-danger btn-small"
                          disabled={isDisabled || language.isDefault}
                          title={language.isDefault ? "Impossible de supprimer la langue par défaut" : ""}
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
            Êtes-vous sûr de vouloir supprimer cette langue ? Cette action est irréversible et supprimera toutes les traductions associées.
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