'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import {
  PageContainer,
  PageHeader,
  PageContent,
  DataTable,
  EmptyState,
  ActionButton,
  DeleteActionButton,
  Badge,
  Column,
} from '../../components/PageLayout/index'
import { useToast } from '@/app/components/Toast/ToastContext'
import { deleteAuditClient, type AuditClientSummary } from '@/lib/actions/audit-client-actions'
import { PAYMENT_TYPE_LABELS, STATUS_LABELS, formatDate, getLinkState } from '@/lib/audit/labels'

const STATUS_VARIANT = { OPEN: 'secondary', DRAFT: 'warning', SUBMITTED: 'success' } as const

export default function AuditClientsClient({ audits }: { audits: AuditClientSummary[] }) {
  const router = useRouter()
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const { success, error } = useToast()

  const handleDelete = async (id: string): Promise<void> => {
    const result = await deleteAuditClient(id)
    if (result.success) {
      success('Audit supprimé (base et fichiers)')
      router.refresh()
    } else {
      error(result.message)
    }
  }

  const columns: Column<AuditClientSummary>[] = [
    {
      key: 'clientName',
      header: 'Client',
      render: (a) => (
        <div className="d-flex align-items-center gap-sm">
          {loadingId === a.id && <LoadingSpinner size="small" message="" inline />}
          <div>
            <div>{a.clientName}</div>
            <div className="text-muted text-xs">{a.clientEmail}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'paymentType',
      header: 'Paiement',
      render: (a) => PAYMENT_TYPE_LABELS[a.paymentType],
    },
    {
      key: 'status',
      header: 'Statut',
      render: (a) => <Badge variant={STATUS_VARIANT[a.status]} text={STATUS_LABELS[a.status]} />,
    },
    {
      key: 'link',
      header: 'Lien',
      render: (a) => {
        const state = getLinkState(a)
        return state === 'active' ? (
          <Badge variant="info" text="Actif" />
        ) : state === 'expired' ? (
          <Badge variant="warning" text="Expiré" />
        ) : (
          <Badge variant="danger" text="Révoqué" />
        )
      },
    },
    { key: 'dueDate', header: 'À retourner avant le', render: (a) => formatDate(a.dueDate) },
    { key: 'submittedAt', header: 'Soumis le', render: (a) => formatDate(a.submittedAt) },
    {
      key: 'actions',
      header: 'Actions',
      width: '100px',
      render: (a) => (
        <DeleteActionButton
          onDelete={() => handleDelete(a.id)}
          disabled={loadingId !== null}
          itemName={`l'audit de ${a.clientName}`}
          confirmMessage={`Supprimer définitivement l'audit de ${a.clientName} ? Les réponses et les fichiers déposés seront effacés.`}
        />
      ),
    },
  ]

  const handleCreate = () => {
    setIsCreating(true)
    router.push('/audits/create')
  }

  return (
    <PageContainer>
      <PageHeader
        title="Audits clients"
        subtitle="Créez les liens privés du questionnaire d'audit et suivez les réponses"
        actions={
          <ActionButton
            label="Nouvel audit"
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
          data={audits}
          columns={columns}
          keyExtractor={(a) => a.id}
          onRowClick={(a) => {
            setLoadingId(a.id)
            router.push(`/audits/${a.id}`)
          }}
          isLoading={false}
          loadingRowId={loadingId}
          emptyState={
            <EmptyState
              message="Aucun audit pour le moment"
              action={<ActionButton label="Créer un premier audit" onClick={handleCreate} variant="primary" />}
            />
          }
        />
      </PageContent>
    </PageContainer>
  )
}
