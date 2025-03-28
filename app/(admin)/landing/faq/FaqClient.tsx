'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Faq } from '@prisma/client'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { deleteFaq } from '@/lib/actions/faq-actions'
import { toast } from 'react-hot-toast'
import Modal from '@/app/components/Common/Modal'

interface FaqClientProps {
  faqs: Faq[]
}

export default function FaqClient({ faqs }: FaqClientProps) {
  const router = useRouter()
  const [loadingFaqId, setLoadingFaqId] = useState<number | null>(null)
  const [deletingFaqId, setDeletingFaqId] = useState<number | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [faqToDelete, setFaqToDelete] = useState<number | null>(null)

  const handleFaqClick = (faqId: number) => {
    setLoadingFaqId(faqId)
    router.push(`/landing/faq/${faqId}/edit`)
  }

  const handleAddNewFaq = () => {
    router.push(`/landing/faq/new`)
  }

  const handleDeleteClick = (e: React.MouseEvent, faqId: number) => {
    e.stopPropagation()
    setFaqToDelete(faqId)
    setIsDeleteModalOpen(true)
  }
  
  const handleDeleteConfirm = async () => {
    if (!faqToDelete) return
    
    setIsDeleteModalOpen(false)
    setDeletingFaqId(faqToDelete)
    
    try {
      const result = await deleteFaq(faqToDelete)
      
      if (result.success) {
        toast.success('FAQ supprimée avec succès')
        router.refresh()
      } else {
        toast.error(result.message || 'Une erreur est survenue lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      toast.error('Une erreur est survenue lors de la suppression')
    } finally {
      setDeletingFaqId(null)
      setFaqToDelete(null)
    }
  }
  
  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false)
    setFaqToDelete(null)
  }
  
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">FAQ</h1>
          <button 
            className="btn btn-primary btn-small"
            onClick={handleAddNewFaq}
          >
            Ajouter une question
          </button>
        </div>
        <p className="page-subtitle">
          Gérez les questions fréquemment posées du site
        </p>
      </div>
      
      <div className="page-content">
        {faqs.length === 0 ? (
          <div className="empty-state">
            <p>Aucune question trouvée</p>
            <button 
              className="btn btn-primary btn-medium mt-4"
              onClick={handleAddNewFaq}
            >
              Ajouter une question
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Question</th>
                  <th>Réponse</th>
                  <th>Ordre</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {faqs.map((faq) => {
                  const isLoading = loadingFaqId === faq.id
                  const isDeleting = deletingFaqId === faq.id
                  const isDisabled = loadingFaqId !== null || deletingFaqId !== null
                  
                  return (
                    <tr 
                      key={faq.id} 
                      onClick={() => !isDisabled && handleFaqClick(faq.id)}
                      className={`clickable-row ${isLoading || isDeleting ? 'loading-row' : ''} ${isDisabled && !isLoading && !isDeleting ? 'disabled-row' : ''}`}
                    >
                      <td>
                        <div className="d-flex align-items-center gap-sm">
                          {isLoading && <LoadingSpinner size="small" message="" inline />}
                          <span className={isLoading ? 'text-muted' : ''}>
                            {faq.question}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="answer-preview">
                          {faq.answer.length > 50 ? `${faq.answer.substring(0, 50)}...` : faq.answer}
                        </div>
                      </td>
                      <td>
                        {faq.order}
                      </td>
                      <td className="text-right">
                        <button
                          onClick={(e) => handleDeleteClick(e, faq.id)}
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
      
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={handleDeleteCancel}
        title="Confirmation de suppression"
      >
        <div className="modal-content">
          <p className="text-danger">
            Êtes-vous sûr de vouloir supprimer cette question ? Cette action est irréversible.
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