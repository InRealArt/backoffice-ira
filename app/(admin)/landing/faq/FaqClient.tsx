'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Faq } from '@prisma/client'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { deleteFaq } from '@/lib/actions/faq-actions'
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

interface FaqClientProps {
  faqs: Faq[]
}

export default function FaqClient({ faqs }: FaqClientProps) {
  const router = useRouter()
  const [loadingFaqId, setLoadingFaqId] = useState<number | null>(null)
  const [sortColumn, setSortColumn] = useState<string>('order')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')
  const { success, error } = useToast()

  const handleFaqClick = (faq: Faq) => {
    setLoadingFaqId(faq.id)
    router.push(`/landing/faq/${faq.id}/edit`)
  }

  const handleAddNewFaq = () => {
    router.push(`/landing/faq/create`)
  }

  const handleDelete = async (faqId: number) => {
    try {
      const result = await deleteFaq(faqId)
      
      if (result.success) {
        success('FAQ supprimée avec succès')
        router.refresh()
      } else {
        error(result.message || 'Une erreur est survenue lors de la suppression')
      }
    } catch (err: any) {
      console.error('Erreur lors de la suppression:', err)
      error('Une erreur est survenue lors de la suppression')
    }
  }

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  // Trier les FAQs selon le champ sélectionné
  const sortedFaqs = [...faqs].sort((a, b) => {
    const valueA = (a as any)[sortColumn] ?? 0
    const valueB = (b as any)[sortColumn] ?? 0
    
    if (sortDirection === 'asc') {
      return typeof valueA === 'string' 
        ? valueA.localeCompare(valueB) 
        : valueA - valueB
    } else {
      return typeof valueA === 'string' 
        ? valueB.localeCompare(valueA) 
        : valueB - valueA
    }
  })

  // Définition des colonnes pour le DataTable
  const columns: Column<Faq>[] = [
    {
      key: 'question',
      header: 'Question',
      render: (faq) => (
        <div className="d-flex align-items-center gap-sm">
          {loadingFaqId === faq.id && <LoadingSpinner size="small" message="" inline />}
          <span className={loadingFaqId === faq.id ? 'text-muted' : ''}>
            {faq.question}
          </span>
        </div>
      )
    },
    {
      key: 'answer',
      header: 'Réponse',
      render: (faq) => (
        <div className={styles.answerPreview}>
          {faq.answer.length > 50 ? `${faq.answer.substring(0, 50)}...` : faq.answer}
        </div>
      )
    },
    {
      key: 'order',
      header: 'Ordre',
      width: '100px',
      sortable: true
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '120px',
      render: (faq) => (
        <DeleteActionButton
          onDelete={() => handleDelete(faq.id)}
          disabled={loadingFaqId !== null}
          itemName={`la question "${faq.question}"`}
          confirmMessage={`Êtes-vous sûr de vouloir supprimer cette question ? Cette action est irréversible.`}
        />
      )
    }
  ]
  
  return (
    <PageContainer>
      <PageHeader 
        title="FAQ"
        subtitle="Gérez les questions fréquemment posées du site"
        actions={
          <ActionButton 
            label="Ajouter une question"
            onClick={handleAddNewFaq}
            size="small"
          />
        }
      />
      
      <PageContent>
        <DataTable
          data={sortedFaqs}
          columns={columns}
          keyExtractor={(faq) => faq.id}
          onRowClick={handleFaqClick}
          isLoading={false}
          loadingRowId={loadingFaqId}
          sortColumn={sortColumn}
          sortDirection={sortDirection}
          onSort={handleSort}
          emptyState={
            <EmptyState 
              message="Aucune question trouvée"
              action={
                <ActionButton
                  label="Ajouter une question"
                  onClick={handleAddNewFaq}
                  variant="primary"
                />
              }
            />
          }
        />
      </PageContent>
    </PageContainer>
  )
} 