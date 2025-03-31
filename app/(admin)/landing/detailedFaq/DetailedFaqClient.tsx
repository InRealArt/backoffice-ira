'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DetailedFaqHeader } from '@prisma/client'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { toast } from 'react-hot-toast'
import Modal from '@/app/components/Common/Modal'
import { deleteDetailedFaqHeader } from '@/lib/actions/faq-actions'


interface DetailedFaqHeaderWithItems extends DetailedFaqHeader {
  faqItems: {
    id: number
    question: string
    answer: string
    detailedFaqId: number
  }[]
}

interface DetailedFaqClientProps {
  faqHeaders: DetailedFaqHeaderWithItems[]
}

export default function DetailedFaqClient({ faqHeaders }: DetailedFaqClientProps) {
  const router = useRouter()
  const [loadingHeaderId, setLoadingHeaderId] = useState<number | null>(null)
  const [deletingHeaderId, setDeletingHeaderId] = useState<number | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [headerToDelete, setHeaderToDelete] = useState<number | null>(null)
  const [showItems, setShowItems] = useState<number | null>(null)

  const handleHeaderClick = (headerId: number) => {
    setLoadingHeaderId(headerId)
    router.push(`/landing/detailedFaq/${headerId}/edit`)
  }

  const handleAddNewHeader = () => {
    router.push(`/landing/detailedFaq/new`)
  }

  const handleDeleteClick = (e: React.MouseEvent, headerId: number) => {
    e.stopPropagation()
    setHeaderToDelete(headerId)
    setIsDeleteModalOpen(true)
  }
  
  const handleDeleteConfirm = async () => {
    if (!headerToDelete) return
    
    setIsDeleteModalOpen(false)
    setDeletingHeaderId(headerToDelete)
    
    try {
      const result = await deleteDetailedFaqHeader(headerToDelete)
      
      if (result.success) {
        toast.success('FAQ détaillée supprimée avec succès')
        router.refresh()
      } else {
        toast.error(result.message || 'Une erreur est survenue lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      toast.error('Une erreur est survenue lors de la suppression')
    } finally {
      setDeletingHeaderId(null)
      setHeaderToDelete(null)
    }
  }
  
  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false)
    setHeaderToDelete(null)
  }

  const toggleShowItems = (e: React.MouseEvent, headerId: number) => {
    e.stopPropagation()
    setShowItems(showItems === headerId ? null : headerId)
  }
  
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">FAQ Détaillées</h1>
          <button 
            className="btn btn-primary btn-small"
            onClick={handleAddNewHeader}
          >
            Ajouter une section
          </button>
        </div>
        <p className="page-subtitle">
          Gérez les sections de FAQ détaillées du site
        </p>
      </div>
      
      <div className="page-content">
        {faqHeaders.length === 0 ? (
          <div className="empty-state">
            <p>Aucune section de FAQ détaillée trouvée</p>
            <button 
              className="btn btn-primary btn-medium mt-4"
              onClick={handleAddNewHeader}
            >
              Ajouter une section
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nom de la section</th>
                  <th>Nombre de questions</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {faqHeaders.map((header) => {
                  const isLoading = loadingHeaderId === header.id
                  const isDeleting = deletingHeaderId === header.id
                  const isDisabled = loadingHeaderId !== null || deletingHeaderId !== null
                  const isShowingItems = showItems === header.id
                  
                  return (
                    <>
                      <tr 
                        key={header.id} 
                        onClick={() => !isDisabled && handleHeaderClick(header.id)}
                        className={`clickable-row ${isLoading || isDeleting ? 'loading-row' : ''} ${isDisabled && !isLoading && !isDeleting ? 'disabled-row' : ''}`}
                      >
                        <td>
                          <div className="d-flex align-items-center gap-sm">
                            {isLoading && <LoadingSpinner size="small" message="" inline />}
                            <span className={isLoading ? 'text-muted' : ''}>
                              {header.name}
                            </span>
                          </div>
                        </td>
                        <td>
                          {header.faqItems.length} question(s)
                        </td>
                        <td className="text-right">
                          <button
                            onClick={(e) => toggleShowItems(e, header.id)}
                            className="btn btn-secondary btn-small mr-2"
                            disabled={isDisabled}
                          >
                            {isShowingItems ? 'Masquer' : 'Voir les questions'}
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(e, header.id)}
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
                      {isShowingItems && header.faqItems.length > 0 && (
                        <tr className="items-row">
                          <td colSpan={3}>
                            <div className="items-container">
                              <h4 className="items-title">Questions de la section {header.name}</h4>
                              <table className="inner-table">
                                <thead>
                                  <tr>
                                    <th>Question</th>
                                    <th>Réponse</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {header.faqItems.map((item) => (
                                    <tr key={item.id}>
                                      <td>{item.question}</td>
                                      <td>
                                        <div className="answer-preview">
                                          {item.answer.length > 50 ? `${item.answer.substring(0, 50)}...` : item.answer}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                      {isShowingItems && header.faqItems.length === 0 && (
                        <tr className="items-row">
                          <td colSpan={3}>
                            <div className="empty-items">
                              <p>Aucune question dans cette section</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
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
            Êtes-vous sûr de vouloir supprimer cette section de FAQ détaillée ? Cette action supprimera également toutes les questions associées. Cette action est irréversible.
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

      <style jsx>{`
        .items-container {
          padding: 1rem;
          background-color: #f8f9fa;
          border-radius: 0.25rem;
          margin-bottom: 1rem;
        }
        
        .items-title {
          margin-bottom: 0.5rem;
          font-size: 1rem;
        }
        
        .inner-table {
          width: 100%;
          border-collapse: collapse;
        }
        
        .inner-table th,
        .inner-table td {
          padding: 0.5rem;
          border: 1px solid #dee2e6;
        }
        
        .inner-table th {
          background-color: #e9ecef;
        }
        
        .answer-preview {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 300px;
        }
        
        .empty-items {
          padding: 1rem;
          text-align: center;
          color: #6c757d;
        }
      `}</style>
    </div>
  )
} 