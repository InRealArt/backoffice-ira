'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { AgencyEvent } from '@/src/generated/prisma/browser'
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
import { deleteAgencyEvent } from '@/lib/actions/agency-event-actions'
import { Plus } from 'lucide-react'

interface AgencyEventsClientProps {
  agencyEvents: AgencyEvent[]
}

export default function AgencyEventsClient({ agencyEvents }: AgencyEventsClientProps) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<number | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const { success, error } = useToast()

  const handleRowClick = (agencyEvent: AgencyEvent) => {
    setLoadingId(agencyEvent.id)
    router.push(`/landing/agency-events/${agencyEvent.id}/edit`)
  }

  const handleCreate = () => {
    setIsCreating(true)
    router.push('/landing/agency-events/create')
  }

  const handleDelete = async (id: number): Promise<void> => {
    const result = await deleteAgencyEvent(id)
    if (result.success) {
      success('Événement supprimé avec succès')
      router.refresh()
    } else {
      error(result.message || 'Erreur lors de la suppression')
    }
  }

  const columns: Column<AgencyEvent>[] = [
    {
      key: 'name',
      header: 'Nom',
      render: (agencyEvent) => (
        <div className="d-flex align-items-center gap-sm">
          {loadingId === agencyEvent.id && (
            <LoadingSpinner size="small" message="" inline />
          )}
          <span className={loadingId === agencyEvent.id ? 'text-muted' : ''}>
            {agencyEvent.name}
          </span>
        </div>
      ),
    },
    {
      key: 'description',
      header: 'Description',
      render: (agencyEvent) => (
        <span className="truncate max-w-md block">{agencyEvent.description}</span>
      ),
    },
    {
      key: 'linkToEvent',
      header: 'Lien',
      render: (agencyEvent) =>
        agencyEvent.linkToEvent ? (
          <a
            href={agencyEvent.linkToEvent}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-blue-600 hover:underline truncate max-w-xs block"
          >
            {agencyEvent.linkToEvent}
          </a>
        ) : (
          '-'
        ),
    },
    {
      key: 'isFeatured',
      header: 'Mis en avant',
      render: (agencyEvent) => (agencyEvent.isFeatured ? 'Oui' : '-'),
    },
    {
      key: 'actions',
      header: 'Actions',
      width: '100px',
      render: (agencyEvent) => (
        <DeleteActionButton
          onDelete={() => handleDelete(agencyEvent.id)}
          disabled={loadingId !== null}
          itemName={`l'événement "${agencyEvent.name}"`}
          confirmMessage={`Êtes-vous sûr de vouloir supprimer l'événement "${agencyEvent.name}" ?`}
        />
      ),
    },
  ]

  return (
    <PageContainer>
      <PageHeader
        title="Événements agence"
        subtitle="Gérez les événements de l'agence affichés sur le site"
        actions={
          <ActionButton
            label="Ajouter un événement"
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
          data={agencyEvents}
          columns={columns}
          keyExtractor={(agencyEvent) => agencyEvent.id}
          onRowClick={handleRowClick}
          isLoading={false}
          loadingRowId={loadingId}
          emptyState={
            <EmptyState
              message="Aucun événement agence trouvé"
              action={
                <ActionButton
                  label="Ajouter un premier événement"
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
