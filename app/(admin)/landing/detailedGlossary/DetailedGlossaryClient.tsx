'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DetailedFaqHeader } from '@prisma/client'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { useToast } from '@/app/components/Toast/ToastContext'
import { deleteDetailedGlossaryHeader } from '@/lib/actions/glossary-actions'
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

interface DetailedGlossaryHeaderWithItems extends DetailedFaqHeader {
  glossaryItems: {
    id: number
    question: string
    answer: string
    detailedGlossaryId: number
  }[]
}

interface DetailedGlossaryClientProps {
    glossaryHeaders: DetailedGlossaryHeaderWithItems[]
}

export default function DetailedGlossaryClient({ glossaryHeaders }: DetailedGlossaryClientProps) {
  const router = useRouter()
  const [loadingHeaderId, setLoadingHeaderId] = useState<number | null>(null)
  const [showItems, setShowItems] = useState<number | null>(null)
  const { success, error } = useToast()

  const handleHeaderClick = (header: DetailedGlossaryHeaderWithItems) => {
    setLoadingHeaderId(header.id)
    router.push(`/landing/detailedGlossary/${header.id}/edit`)
  }

  const handleAddNewHeader = () => {
    router.push(`/landing/detailedGlossary/create`)
  }

  const toggleShowItems = (e: React.MouseEvent, headerId: number) => {
    e.stopPropagation()
    setShowItems(showItems === headerId ? null : headerId)
  }

  const handleDelete = async (headerId: number) => {
    try {
      const result = await deleteDetailedGlossaryHeader(headerId)
      
      if (result.success) {
        success('Glossaire détaillé supprimé avec succès')
        router.refresh()
      } else {
        error(result.message || 'Une erreur est survenue lors de la suppression')
      }
    } catch (err: any) {
      console.error('Erreur lors de la suppression:', err)
      error('Une erreur est survenue lors de la suppression')
    }
  }

  // Définition des colonnes pour le DataTable
  const columns: Column<DetailedGlossaryHeaderWithItems>[] = [
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
      key: 'itemsCount',
      header: 'Nombre de questions',
      render: (header) => `${header.glossaryItems.length} question(s)`
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (header) => {
        const isDisabled = loadingHeaderId !== null
        const isShowingItems = showItems === header.id
        
        return (
          <div className="d-flex align-items-center justify-content-end gap-sm">
            <button
              onClick={(e) => toggleShowItems(e, header.id)}
              className="btn btn-secondary btn-small"
              disabled={isDisabled}
            >
              {isShowingItems ? 'Masquer' : 'Voir les questions'}
            </button>
            <DeleteActionButton
              onDelete={() => handleDelete(header.id)}
              disabled={isDisabled}
              itemName={`la section "${header.name}"`}
              confirmMessage={`Êtes-vous sûr de vouloir supprimer la section "${header.name}" ? Cette action supprimera également toutes les questions associées. Cette action est irréversible.`}
            />
          </div>
        )
      }
    }
  ]
  
  return (
    <PageContainer>
      <PageHeader 
        title="Glossaire détaillé"
        subtitle="Gérez les sections de Glossaire détaillé du site"
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
          data={glossaryHeaders}
          columns={columns}
          keyExtractor={(header) => header.id}
          onRowClick={handleHeaderClick}
          isLoading={false}
          loadingRowId={loadingHeaderId}
          emptyState={
            <EmptyState 
              message="Aucune section de Glossaire détaillé trouvée"
              action={
                <ActionButton
                  label="Ajouter une première section"
                  onClick={handleAddNewHeader}
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
              const header = glossaryHeaders.find(h => h.id === showItems)
              if (!header) return null
              
              return (
                <div className={styles.itemsContainer}>
                  <h4 className={styles.itemsTitle}>Questions de la section {header.name}</h4>
                  {header.glossaryItems.length > 0 ? (
                    <table className={styles.innerTable}>
                      <thead>
                        <tr>
                          <th>Question</th>
                          <th>Réponse</th>
                        </tr>
                      </thead>
                      <tbody>
                        {header.glossaryItems.map((item) => (
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