'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DetailedFaqPage } from '@prisma/client'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { toast } from 'react-hot-toast'
import Modal from '@/app/components/Common/Modal'
import { deleteDetailedFaqPage } from '@/lib/actions/faq-page-actions'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface DetailedFaqPageWithItems extends DetailedFaqPage {
  faqItems: {
    id: number
    question: string
    answer: string
    detailedFaqPageId: number
    order: number
  }[]
}

interface DetailedFaqPageClientProps {
  faqPages: DetailedFaqPageWithItems[]
}

type SortField = 'page' | 'order' | null
type SortDirection = 'asc' | 'desc'

export default function DetailedFaqPageClient({ faqPages }: DetailedFaqPageClientProps) {
  const router = useRouter()
  const [loadingPageId, setLoadingPageId] = useState<number | null>(null)
  const [deletingPageId, setDeletingPageId] = useState<number | null>(null)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [pageToDelete, setPageToDelete] = useState<number | null>(null)
  const [showItems, setShowItems] = useState<number | null>(null)
  
  // État pour le tri
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const handlePageClick = (pageId: number) => {
    setLoadingPageId(pageId)
    router.push(`/landing/detailedFaqPage/${pageId}/edit`)
  }

  const handleAddNewPage = () => {
    router.push(`/landing/detailedFaqPage/create`)
  }

  const handleDeleteClick = (e: React.MouseEvent, pageId: number) => {
    e.stopPropagation()
    setPageToDelete(pageId)
    setIsDeleteModalOpen(true)
  }
  
  const handleDeleteConfirm = async () => {
    if (!pageToDelete) return
    
    setIsDeleteModalOpen(false)
    setDeletingPageId(pageToDelete)
    
    try {
      const result = await deleteDetailedFaqPage(pageToDelete)
      
      if (result.success) {
        toast.success('FAQ par page supprimée avec succès')
        router.refresh()
      } else {
        toast.error(result.message || 'Une erreur est survenue lors de la suppression')
      }
    } catch (error) {
      console.error('Erreur lors de la suppression:', error)
      toast.error('Une erreur est survenue lors de la suppression')
    } finally {
      setDeletingPageId(null)
      setPageToDelete(null)
    }
  }
  
  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false)
    setPageToDelete(null)
  }

  const toggleShowItems = (e: React.MouseEvent, pageId: number) => {
    e.stopPropagation()
    setShowItems(showItems === pageId ? null : pageId)
  }

  // Fonction utilitaire pour formater le nom de la page
  const formatPageName = (pageName: string) => {
    if (pageName.startsWith('/')) {
      return pageName === '/' ? 'Page d\'accueil' : pageName
    }
    return pageName
  }
  
  // Fonction pour calculer l'ordre moyen des questions pour chaque page
  const getAverageOrder = (page: DetailedFaqPageWithItems): number => {
    if (!page.faqItems || page.faqItems.length === 0) return 0
    
    const sum = page.faqItems.reduce((acc, item) => acc + item.order, 0)
    return sum / page.faqItems.length
  }
  
  // Fonction pour gérer le tri
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      // Si on clique sur la même colonne, on inverse l'ordre
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      // Si on clique sur une nouvelle colonne, on la trie par défaut en ordre croissant
      setSortField(field)
      setSortDirection('asc')
    }
  }
  
  // Trier les FAQ pages selon les critères sélectionnés
  const sortedFaqPages = [...faqPages].sort((a, b) => {
    if (sortField === 'page') {
      const nameA = a.name.toString().toLowerCase()
      const nameB = b.name.toString().toLowerCase()
      
      return sortDirection === 'asc' 
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA)
    } else if (sortField === 'order') {
      const orderA = getAverageOrder(a)
      const orderB = getAverageOrder(b)
      
      return sortDirection === 'asc'
        ? orderA - orderB
        : orderB - orderA
    }
    
    // Par défaut, retourner l'ordre original
    return 0
  })
  
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null
    
    return sortDirection === 'asc'
      ? <ChevronUp size={14} className="sort-icon" />
      : <ChevronDown size={14} className="sort-icon" />
  }
  
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">FAQ par Page</h1>
          <button 
            className="btn btn-primary btn-small"
            onClick={handleAddNewPage}
          >
            Ajouter une FAQ pour une page
          </button>
        </div>
        <p className="page-subtitle">
          Gérez les FAQ spécifiques à chaque page du site
        </p>
      </div>
      
      <div className="page-content">
        {faqPages.length === 0 ? (
          <div className="empty-state">
            <p>Aucune FAQ par page trouvée</p>
            <button 
              className="btn btn-primary btn-medium mt-4"
              onClick={handleAddNewPage}
            >
              Ajouter une FAQ pour une page
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('page')}
                  >
                    <div className="header-content">
                      Page
                      {renderSortIcon('page')}
                    </div>
                  </th>
                  <th>Nombre de questions</th>
                  <th 
                    className="sortable-header"
                    onClick={() => handleSort('order')}
                  >
                    <div className="header-content">
                      Ordre dans la page
                      {renderSortIcon('order')}
                    </div>
                  </th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedFaqPages.map((page) => {
                  const isLoading = loadingPageId === page.id
                  const isDeleting = deletingPageId === page.id
                  const isDisabled = loadingPageId !== null || deletingPageId !== null
                  const isShowingItems = showItems === page.id
                  const averageOrder = getAverageOrder(page)
                  
                  return (
                    <>
                      <tr 
                        key={page.id} 
                        onClick={() => !isDisabled && handlePageClick(page.id)}
                        className={`clickable-row ${isLoading || isDeleting ? 'loading-row' : ''} ${isDisabled && !isLoading && !isDeleting ? 'disabled-row' : ''}`}
                      >
                        <td>
                          <div className="d-flex align-items-center gap-sm">
                            {isLoading && <LoadingSpinner size="small" message="" inline />}
                            <span className={isLoading ? 'text-muted' : ''}>
                              {formatPageName(page.name.toString())}
                            </span>
                          </div>
                        </td>
                        <td>
                          {page.faqItems.length} question(s)
                        </td>
                        <td>
                          {page.faqItems.length > 0 ? Math.round(averageOrder) : '-'}
                        </td>
                        <td className="text-right">
                          <button
                            onClick={(e) => toggleShowItems(e, page.id)}
                            className="btn btn-secondary btn-small mr-2"
                            disabled={isDisabled}
                          >
                            {isShowingItems ? 'Masquer' : 'Voir les questions'}
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(e, page.id)}
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
                      {isShowingItems && page.faqItems.length > 0 && (
                        <tr className="items-row">
                          <td colSpan={4}>
                            <div className="items-container">
                              <h4 className="items-title">Questions de la page {formatPageName(page.name.toString())}</h4>
                              <table className="inner-table">
                                <thead>
                                  <tr>
                                    <th>Ordre</th>
                                    <th>Question</th>
                                    <th>Réponse</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {page.faqItems.sort((a, b) => a.order - b.order).map((item) => (
                                    <tr key={item.id}>
                                      <td width="70">{item.order}</td>
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
                      {isShowingItems && page.faqItems.length === 0 && (
                        <tr className="items-row">
                          <td colSpan={4}>
                            <div className="empty-items">
                              <p>Aucune question pour cette page</p>
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
            Êtes-vous sûr de vouloir supprimer cette FAQ de page ? Cette action supprimera également toutes les questions associées. Cette action est irréversible.
          </p>
          
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={handleDeleteCancel}>
              Annuler
            </button>
            <button className="btn btn-danger btn-medium" onClick={handleDeleteConfirm}>
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
          border-bottom: 1px solid #e5e7eb;
          text-align: left;
        }
        
        .inner-table th {
          font-weight: 600;
          color: #6b7280;
        }
        
        .answer-preview {
          max-width: 300px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          color: #6b7280;
        }
        
        .empty-items {
          padding: 1rem;
          text-align: center;
          color: #6b7280;
        }
        
        .items-row td {
          padding: 0;
        }
        
        .clickable-row {
          cursor: pointer;
        }
        
        .clickable-row:hover {
          background-color: #f9fafb;
        }
        
        .loading-row {
          opacity: 0.7;
          pointer-events: none;
        }
        
        .disabled-row {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .sortable-header {
          cursor: pointer;
        }
        
        .sortable-header:hover {
          background-color: #f9fafb;
        }
        
        .header-content {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        
        .sort-icon {
          color: #6366f1;
        }
      `}</style>
    </div>
  )
} 