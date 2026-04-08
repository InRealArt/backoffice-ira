'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Exhibition } from '@/src/generated/prisma/browser'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import {
  PageContainer,
  PageHeader,
  PageContent,
  DataTable,
  EmptyState,
  ActionButton,
  DeleteActionButton,
  Column,
} from '../../../components/PageLayout/index'
import { useToast } from '@/app/components/Toast/ToastContext'
import { deleteExhibition } from '@/lib/actions/exhibition-actions'
import { Plus } from 'lucide-react'

interface ExhibitionsClientProps {
  exhibitions: Exhibition[]
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(date))
}

export default function ExhibitionsClient({ exhibitions }: ExhibitionsClientProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<number | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const { success, error } = useToast()

  const handleRowClick = (exhibition: Exhibition) => {
    setLoadingId(exhibition.id)
    router.push(`/landing/exhibitions/${exhibition.id}/edit`)
  }

  const handleCreate = () => {
    setIsCreating(true)
    router.push('/landing/exhibitions/create')
  }

  const handleDelete = async (id: number): Promise<void> => {
    const result = await deleteExhibition(id)
    if (result.success) {
      success('Exposition supprimée avec succès')
      router.refresh()
    } else {
      error(result.message || 'Erreur lors de la suppression')
    }
  }

  const columns: Column<Exhibition>[] = [
    {
      key: 'name',
      header: 'Nom',
      render: (exhibition) => (
        <div className="d-flex align-items-center gap-sm">
          {loadingId === exhibition.id && (
            <LoadingSpinner size="small" message="" inline />
          )}
          <span className={loadingId === exhibition.id ? 'text-muted' : ''}>
            {exhibition.name}
          </span>
        </div>
      ),
    },
    {
      key: 'startDate',
      header: 'Date de début',
      render: (exhibition) => formatDate(exhibition.startDate),
    },
    {
      key: 'endDate',
      header: 'Date de fin',
      render: (exhibition) => formatDate(exhibition.endDate),
    },
    {
      key: 'address',
      header: 'Adresse',
      render: (exhibition) => exhibition.address,
    },
    {
      key: 'linkToEvent',
      header: 'Lien',
      render: (exhibition) =>
        exhibition.linkToEvent ? (
          <a
            href={exhibition.linkToEvent}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-blue-600 hover:underline truncate max-w-xs block"
          >
            {exhibition.linkToEvent}
          </a>
        ) : (
          '-'
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '100px',
      render: (exhibition) => (
        <DeleteActionButton
          onDelete={() => handleDelete(exhibition.id)}
          disabled={loadingId !== null}
          itemName={`l'exposition "${exhibition.name}"`}
          confirmMessage={`Êtes-vous sûr de vouloir supprimer l'exposition "${exhibition.name}" ?`}
        />
      ),
    },
  ]

  return (
    <PageContainer>
      <PageHeader
        title="Expositions"
        subtitle="Gérez les expositions affichées sur le site"
        actions={
          <ActionButton
            label="Ajouter une exposition"
            onClick={handleCreate}
            size="small"
            disabled={isCreating}
            icon={isCreating ? undefined : <Plus size={16} />}
            isLoading={isCreating}
          />
        }
      />

      <PageContent>
        <DataTable
          data={exhibitions}
          columns={columns}
          keyExtractor={(exhibition) => exhibition.id}
          onRowClick={handleRowClick}
          isLoading={false}
          loadingRowId={loadingId}
          emptyState={
            <EmptyState
              message="Aucune exposition trouvée"
              action={
                <ActionButton
                  label="Ajouter une première exposition"
                  onClick={handleCreate}
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
