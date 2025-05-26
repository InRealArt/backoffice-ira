'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Translation } from '@prisma/client'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { useToast } from '@/app/components/Toast/ToastContext' 
import Modal from '@/app/components/Common/Modal'
import { deleteTranslation } from '@/lib/actions/translation-actions'
import { Filters, FilterItem } from '@/app/components/Common'

interface TranslationWithLanguage extends Translation {
  language: {
    id: number
    name: string
    code: string
  }
}

interface TranslationsClientProps {
  translations: TranslationWithLanguage[]
}

export default function TranslationsClient({ translations }: TranslationsClientProps) {
  const router = useRouter()
  const [loadingTranslationId, setLoadingTranslationId] = useState<number | null>(null)
  const [deletingTranslationId, setDeletingTranslationId] = useState<number | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [translationToDelete, setTranslationToDelete] = useState<number | null>(null)
  const [selectedEntityType, setSelectedEntityType] = useState<string>('')
  const [selectedLanguageId, setSelectedLanguageId] = useState<number | null>(null)
  const { success, error } = useToast()
  const handleTranslationClick = (translationId: number) => {
    setLoadingTranslationId(translationId)
    router.push(`/landing/translations/${translationId}/edit`)
  }

  const handleAddNewTranslation = () => {
    router.push(`/landing/translations/new`)
  }

  const handleDeleteClick = (e: React.MouseEvent, translationId: number) => {
    e.stopPropagation() // Empêche le déclenchement du click sur la ligne
    setTranslationToDelete(translationId)
    setIsDeleteModalOpen(true)
  }
  
  const handleDeleteConfirm = async () => {
    if (!translationToDelete) return
    
    setIsDeleteModalOpen(false)
    setDeletingTranslationId(translationToDelete)
    
    try {
      const result = await deleteTranslation(translationToDelete)
      
      if (result.success) {
        success('Traduction supprimée avec succès')
        router.refresh()
      } else {
        error(result.message || 'Une erreur est survenue lors de la suppression')
      }
    } catch (error: any) {
      console.error('Erreur lors de la suppression:', error)
      error('Une erreur est survenue lors de la suppression')
    } finally {
      setDeletingTranslationId(null)
      setTranslationToDelete(null)
    }
  }
  
  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false)
    setTranslationToDelete(null)
  }
  
  // Extraire les types d'entités uniques pour les filtres
  const uniqueEntityTypes = Array.from(new Set(translations.map(t => t.entityType)))
  
  // Extraire les langues uniques pour les filtres
  const uniqueLanguages = Array.from(
    new Map(translations.map(t => [t.languageId, t.language])).values()
  )
  
  // Filtrer les traductions en fonction des filtres sélectionnés
  const filteredTranslations = translations.filter(translation => {
    const matchesEntityType = selectedEntityType ? translation.entityType === selectedEntityType : true
    const matchesLanguage = selectedLanguageId ? translation.languageId === selectedLanguageId : true
    return matchesEntityType && matchesLanguage
  })
  
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">Traductions</h1>
          <button 
            className="btn btn-primary btn-small"
            onClick={handleAddNewTranslation}
          >
            Ajouter une traduction
          </button>
        </div>
        <p className="page-subtitle">
          Gestion des traductions pour le contenu du site
        </p>
      </div>
      
      <Filters>
        <FilterItem
          id="entityTypeFilter"
          label="Filtrer par type d'entité:"
          value={selectedEntityType}
          onChange={(value) => setSelectedEntityType(value)}
          options={[
            { value: '', label: 'Tous les types d\'entité' },
            ...uniqueEntityTypes.map(type => ({
              value: type,
              label: type
            }))
          ]}
        />
        <FilterItem
          id="languageFilter"
          label="Filtrer par langue:"
          value={selectedLanguageId ? selectedLanguageId.toString() : ''}
          onChange={(value) => setSelectedLanguageId(value ? parseInt(value) : null)}
          options={[
            { value: '', label: 'Toutes les langues' },
            ...uniqueLanguages.map(language => ({
              value: language.id.toString(),
              label: `${language.name} (${language.code})`
            }))
          ]}
        />
      </Filters>
      
      <div className="page-content">
        {filteredTranslations.length === 0 ? (
          <div className="empty-state">
            <p>Aucune traduction trouvée</p>
            <button 
              className="btn btn-primary btn-medium mt-4"
              onClick={handleAddNewTranslation}
            >
              Ajouter une traduction
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Type d'entité</th>
                  <th>ID Entité</th>
                  <th>Champ</th>
                  <th>Langue</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTranslations.map((translation) => {
                  const isLoading = loadingTranslationId === translation.id
                  const isDeleting = deletingTranslationId === translation.id
                  const isDisabled = loadingTranslationId !== null || deletingTranslationId !== null
                  
                  return (
                    <tr 
                      key={translation.id} 
                      onClick={() => !isDisabled && handleTranslationClick(translation.id)}
                      className={`clickable-row ${isLoading || isDeleting ? 'loading-row' : ''} ${isDisabled && !isLoading && !isDeleting ? 'disabled-row' : ''}`}
                    >
                      <td>
                        <div className="d-flex align-items-center gap-sm">
                          {isLoading && <LoadingSpinner size="small" message="" inline />}
                          <span className={isLoading ? 'text-muted' : ''}>
                            {translation.entityType}
                          </span>
                        </div>
                      </td>
                      <td>{translation.entityId}</td>
                      <td>{translation.field}</td>
                      <td>{translation.language.name} ({translation.language.code})</td>
                      <td className="text-right">
                        <button
                          onClick={(e) => handleDeleteClick(e, translation.id)}
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
            Êtes-vous sûr de vouloir supprimer cette traduction ? Cette action est irréversible.
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