'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DetailedFaqPage } from '@prisma/client'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { deleteDetailedFaqPage } from '@/lib/actions/faq-page-actions'
import { ChevronDown, ChevronUp } from 'lucide-react'
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
import styles from '../../../styles/list-components.module.scss'

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
  const [showItems, setShowItems] = useState<number | null>(null)
  const { success, error } = useToast()

  // État pour le tri
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  const handlePageClick = (page: DetailedFaqPageWithItems) => {
    setLoadingPageId(page.id)
    router.push(`/landing/detailedFaqPage/${page.id}/edit`)
  }

  const handleAddNewPage = () => {
    router.push(`/landing/detailedFaqPage/create`)
  }

  const toggleShowItems = (e: React.MouseEvent, pageId: number) => {
    e.stopPropagation()
    setShowItems(showItems === pageId ? null : pageId)
  }

  const handleDelete = async (pageId: number) => {
    try {
      const result = await deleteDetailedFaqPage(pageId)
      
      if (result.success) {
        success('FAQ par page supprimée avec succès')
        router.refresh()
      } else {
        error(result.message || 'Une erreur est survenue lors de la suppression')
      }
    } catch (err: any) {
      console.error('Erreur lors de la suppression:', err)
      error('Une erreur est survenue lors de la suppression')
    }
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
      ? <ChevronUp size={14} className={styles.sortIcon} />
      : <ChevronDown size={14} className={styles.sortIcon} />
  }

  // Définition des colonnes pour le DataTable
  const columns: Column<DetailedFaqPageWithItems>[] = [
    {
      key: 'page',
      header: (
        <div 
          className={`${styles.headerContent} ${styles.sortableHeader}`}
          onClick={() => handleSort('page')}
        >
          Page
          {renderSortIcon('page')}
        </div>
      ),
      sortable: true,
      render: (page) => (
        <div className="d-flex align-items-center gap-sm">
          {loadingPageId === page.id && <LoadingSpinner size="small" message="" inline />}
          <span className={loadingPageId === page.id ? 'text-muted' : ''}>
            {formatPageName(page.name.toString())}
          </span>
        </div>
      )
    },
    {
      key: 'itemsCount',
      header: 'Nombre de questions',
      render: (page) => `${page.faqItems.length} question(s)`
    },
    {
      key: 'order',
      header: (
        <div 
          className={`${styles.headerContent} ${styles.sortableHeader}`}
          onClick={() => handleSort('order')}
        >
          Ordre dans la page
          {renderSortIcon('order')}
        </div>
      ),
      sortable: true,
      render: (page) => {
        const averageOrder = getAverageOrder(page)
        return page.faqItems.length > 0 ? Math.round(averageOrder).toString() : '-'
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (page) => {
        const isDisabled = loadingPageId !== null
        const isShowingItems = showItems === page.id
        
        return (
          <div className="d-flex align-items-center justify-content-end gap-sm">
            <button
              onClick={(e) => toggleShowItems(e, page.id)}
              className="btn btn-secondary btn-small"
              disabled={isDisabled}
            >
              {isShowingItems ? 'Masquer' : 'Voir les questions'}
            </button>
            <DeleteActionButton
              onDelete={() => handleDelete(page.id)}
              disabled={isDisabled}
              itemName={`la FAQ de la page "${formatPageName(page.name.toString())}"`}
              confirmMessage={`Êtes-vous sûr de vouloir supprimer la FAQ de la page "${formatPageName(page.name.toString())}" ? Cette action supprimera également toutes les questions associées. Cette action est irréversible.`}
            />
          </div>
        )
      }
    }
  ]
  
  return (
    <PageContainer>
      <PageHeader 
        title="FAQ par Page"
        subtitle="Gérez les FAQ spécifiques à chaque page du site"
        actions={
          <ActionButton 
            label="Ajouter une FAQ pour une page"
            onClick={handleAddNewPage}
            size="small"
          />
        }
      />
      
      <PageContent>
        <DataTable
          data={sortedFaqPages}
          columns={columns}
          keyExtractor={(page) => page.id}
          onRowClick={handlePageClick}
          isLoading={false}
          loadingRowId={loadingPageId}
          sortColumn={sortField || undefined}
          sortDirection={sortDirection}
          onSort={(column) => handleSort(column as SortField)}
          emptyState={
            <EmptyState 
              message="Aucune FAQ par page trouvée"
              action={
                <ActionButton
                  label="Ajouter une première FAQ pour une page"
                  onClick={handleAddNewPage}
                  variant="primary"
                />
              }
            />
          }
        />

        {/* Affichage des items en dehors du tableau */}
        {showItems && (
          <div className={styles.itemsSection}>
            {(() => {
              const page = faqPages.find(p => p.id === showItems)
              if (!page) return null
              
              return (
                <div className={styles.itemsContainer}>
                  <h4 className={styles.itemsTitle}>Questions de la page {formatPageName(page.name.toString())}</h4>
                  {page.faqItems.length > 0 ? (
                    <table className={styles.innerTable}>
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
                              <div className={styles.answerPreview}>
                                {item.answer.length > 50 ? `${item.answer.substring(0, 50)}...` : item.answer}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div className={styles.emptyItems}>
                      <p>Aucune question pour cette page</p>
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        )}
      </PageContent>
    </PageContainer>
  )
} 