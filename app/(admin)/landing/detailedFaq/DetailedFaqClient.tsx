'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DetailedFaqHeader } from '@prisma/client'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { useToast } from '@/app/components/Toast/ToastContext'
import { deleteDetailedFaqHeader } from '@/lib/actions/faq-actions'
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
  const [showItems, setShowItems] = useState<number | null>(null)
  const { success, error } = useToast()

  const handleHeaderClick = (header: DetailedFaqHeaderWithItems) => {
    setLoadingHeaderId(header.id)
    router.push(`/landing/detailedFaq/${header.id}/edit`)
  }

  const handleAddNewHeader = () => {
    router.push(`/landing/detailedFaq/create`)
  }

  const handleDelete = async (headerId: number) => {
    try {
      const result = await deleteDetailedFaqHeader(headerId)
      
      if (result.success) {
        success('FAQ détaillée supprimée avec succès')
        router.refresh()
      } else {
        error(result.message || 'Une erreur est survenue lors de la suppression')
      }
    } catch (err: any) {
      console.error('Erreur lors de la suppression:', err)
      error('Une erreur est survenue lors de la suppression')
    }
  }

  const toggleShowItems = (e: React.MouseEvent, headerId: number) => {
    e.stopPropagation()
    setShowItems(showItems === headerId ? null : headerId)
  }

  // Définition des colonnes pour le DataTable
  const columns: Column<DetailedFaqHeaderWithItems>[] = [
    {
      key: 'name',
      header: 'Nom de la section',
      render: (header) => (
        <div className="d-flex align-items-center gap-sm">
          {loadingHeaderId === header.id && <LoadingSpinner size="small" message="" inline />}
          <span className={loadingHeaderId === header.id ? 'text-muted' : ''}>
            {header.name}
          </span>
        </div>
      )
    },
    {
      key: 'faqItems',
      header: 'Nombre de questions',
      render: (header) => `${header.faqItems.length} question(s)`
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '200px',
      render: (header) => (
        <div className="d-flex gap-sm">
          <ActionButton
            label={showItems === header.id ? 'Masquer' : 'Voir les questions'}
            onClick={() => {
              const event = new MouseEvent('click')
              toggleShowItems(event as any, header.id)
            }}
            variant="secondary"
            size="small"
            disabled={loadingHeaderId !== null}
          />
          <DeleteActionButton
            onDelete={() => handleDelete(header.id)}
            disabled={loadingHeaderId !== null}
            itemName={`la section "${header.name}"`}
            confirmMessage={`Êtes-vous sûr de vouloir supprimer la section "${header.name}" ? Cette action supprimera également toutes les questions associées. Cette action est irréversible.`}
          />
        </div>
      )
    }
  ]

  return (
    <PageContainer>
      <PageHeader 
        title="FAQ Détaillées"
        subtitle="Gérez les sections de FAQ détaillées du site"
        actions={
          <ActionButton 
            label="Ajouter une section"
            onClick={handleAddNewHeader}
            size="small"
          />
        }
      />
      
      <PageContent>
        <DataTable
          data={faqHeaders}
          columns={columns}
          keyExtractor={(header) => header.id}
          onRowClick={handleHeaderClick}
          isLoading={false}
          loadingRowId={loadingHeaderId}
          emptyState={
            <EmptyState 
              message="Aucune section de FAQ détaillée trouvée"
              action={
                <ActionButton
                  label="Ajouter une section"
                  onClick={handleAddNewHeader}
                  variant="primary"
                />
              }
            />
          }
        />

        {/* Section d'affichage des items FAQ */}
        {showItems !== null && (
          <div className={styles.itemsSection}>
            {(() => {
              const selectedHeader = faqHeaders.find(h => h.id === showItems)
              if (!selectedHeader) return null

              return (
                <div className={styles.itemsContainer}>
                  <h4 className={styles.itemsTitle}>
                    Questions de la section {selectedHeader.name}
                  </h4>
                  {selectedHeader.faqItems.length > 0 ? (
                    <table className={styles.innerTable}>
                      <thead>
                        <tr>
                          <th>Question</th>
                          <th>Réponse</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedHeader.faqItems.map((item) => (
                          <tr key={item.id}>
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
                      <p>Aucune question dans cette section</p>
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