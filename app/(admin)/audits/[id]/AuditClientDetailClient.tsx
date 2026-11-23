'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageContainer, PageHeader, PageContent, Badge, DeleteActionButton } from '../../../components/PageLayout/index'
import { useToast } from '@/app/components/Toast/ToastContext'
import {
  deleteAuditClient,
  extendAuditExpiration,
  getAuditFileDownloadUrl,
  regenerateAuditLink,
  reopenAudit,
  revokeAuditLink,
  type AuditClientDetail,
} from '@/lib/actions/audit-client-actions'
import {
  FILE_KIND_LABELS,
  PAYMENT_TYPE_LABELS,
  STATUS_LABELS,
  formatDate,
  getLinkState,
  toDateInputValue,
} from '@/lib/audit/labels'
import AuditLinkBox from '../AuditLinkBox'

function renderValue(value: unknown): string {
  if (value === null || value === undefined || value === '') return '-'
  if (typeof value === 'string') return value
  return JSON.stringify(value, null, 2)
}

function questionOrder(key: string): number {
  const n = Number(key.replace(/^q/, ''))
  return Number.isFinite(n) ? n : Number.MAX_SAFE_INTEGER
}

function formatSize(bytes: number): string {
  return bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} Ko` : `${(bytes / 1024 / 1024).toFixed(1)} Mo`
}

export default function AuditClientDetailClient({ audit }: { audit: AuditClientDetail }) {
  const router = useRouter()
  const { success, error } = useToast()
  const [newLink, setNewLink] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [expiresAt, setExpiresAt] = useState(toDateInputValue(audit.expiresAt))

  const linkState = getLinkState(audit)
  const answerEntries = Object.entries(audit.answers).sort(([a], [b]) => questionOrder(a) - questionOrder(b))

  const run = async <T extends { success: boolean }>(fn: () => Promise<T | { success: false; message: string }>, okMessage: string) => {
    setBusy(true)
    try {
      const result = await fn()
      if (result.success) {
        success(okMessage)
        router.refresh()
      } else {
        error((result as { message: string }).message)
      }
      return result
    } finally {
      setBusy(false)
    }
  }

  const handleRegenerate = async () => {
    const r = await run(() => regenerateAuditLink(audit.id), 'Nouveau lien généré, l’ancien est invalidé')
    if (r.success && 'link' in r) setNewLink(r.link as string)
  }

  const handleReopen = async () => {
    const r = await run(() => reopenAudit(audit.id), 'Audit rouvert avec un nouveau lien')
    if (r.success && 'link' in r) setNewLink(r.link as string)
  }

  const handleDownload = async (fileId: string) => {
    const result = await getAuditFileDownloadUrl(fileId)
    if (result.success) window.open(result.url, '_blank', 'noopener,noreferrer')
    else error(result.message)
  }

  const handleDelete = async (): Promise<void> => {
    const result = await deleteAuditClient(audit.id)
    if (result.success) {
      success('Audit supprimé (base et fichiers)')
      router.push('/audits')
    } else {
      error(result.message)
    }
  }

  return (
    <PageContainer>
      <PageHeader title={`Audit de ${audit.clientName}`} subtitle={audit.clientEmail} />
      <PageContent>
        <div className="form-container">
          <div className="form-card">
            <div className="card-header">
              <h2 className="card-title">Suivi</h2>
            </div>
            <div className="card-content">
              <p>
                Statut :{' '}
                <Badge
                  variant={audit.status === 'SUBMITTED' ? 'success' : audit.status === 'DRAFT' ? 'warning' : 'secondary'}
                  text={STATUS_LABELS[audit.status]}
                />{' '}
                Lien :{' '}
                <Badge
                  variant={linkState === 'active' ? 'info' : linkState === 'expired' ? 'warning' : 'danger'}
                  text={linkState === 'active' ? 'Actif' : linkState === 'expired' ? 'Expiré' : 'Révoqué'}
                />
              </p>
              <p>Paiement : {PAYMENT_TYPE_LABELS[audit.paymentType]} (le {formatDate(audit.paidAt)})</p>
              <p>Auditeur : {audit.auditorName || '-'}</p>
              <p>À retourner avant le : {formatDate(audit.dueDate)}</p>
              <p>Créé le : {formatDate(audit.createdAt)}</p>
              <p>Soumis le : {formatDate(audit.submittedAt)}</p>
              <p>
                Consentement : {audit.consentAt ? `${formatDate(audit.consentAt)} — ${audit.signatureName ?? ''}` : '-'}
              </p>
              <p>Version du questionnaire : {audit.questionnaireVersion}</p>
            </div>
          </div>

          <div className="form-card">
            <div className="card-header">
              <h2 className="card-title">Lien privé</h2>
            </div>
            <div className="card-content">
              {newLink && <AuditLinkBox link={newLink} />}
              <div className="form-group">
                <label htmlFor="expiresAt" className="form-label">Expire le</label>
                <div className="d-flex gap-sm align-items-center">
                  <input
                    id="expiresAt"
                    type="date"
                    value={expiresAt}
                    onChange={(e) => setExpiresAt(e.target.value)}
                    className="form-input"
                    disabled={busy}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={busy || !expiresAt}
                    onClick={() => run(() => extendAuditExpiration(audit.id, expiresAt), 'Expiration mise à jour')}
                  >
                    Prolonger / modifier
                  </button>
                </div>
              </div>
              <div className="d-flex gap-sm">
                <button type="button" className="btn btn-secondary" disabled={busy} onClick={handleRegenerate}>
                  Régénérer le lien
                </button>
                {audit.status === 'SUBMITTED' && (
                  <button type="button" className="btn btn-secondary" disabled={busy} onClick={handleReopen}>
                    Rouvrir le formulaire
                  </button>
                )}
                {!audit.revokedAt && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    disabled={busy}
                    onClick={async () => {
                      const r = await run(() => revokeAuditLink(audit.id), 'Lien révoqué')
                      if (r.success) setNewLink(null)
                    }}
                  >
                    Révoquer le lien
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="form-card">
            <div className="card-header">
              <h2 className="card-title">Pièces jointes ({audit.files.length})</h2>
            </div>
            <div className="card-content">
              {audit.files.length === 0 ? (
                <p className="text-muted">Aucun fichier déposé.</p>
              ) : (
                <ul>
                  {audit.files.map((f) => (
                    <li key={f.id}>
                      {FILE_KIND_LABELS[f.kind]} —{' '}
                      <button type="button" className="btn-link" onClick={() => handleDownload(f.id)}>
                        {f.filename}
                      </button>{' '}
                      ({formatSize(f.sizeBytes)})
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="form-card">
            <div className="card-header">
              <h2 className="card-title">Réponses ({answerEntries.length})</h2>
            </div>
            <div className="card-content">
              {answerEntries.length === 0 ? (
                <p className="text-muted">Aucune réponse enregistrée.</p>
              ) : (
                answerEntries.map(([key, value]) => (
                  <div key={key} className="form-group">
                    <strong>{key.toUpperCase()}</strong>
                    <pre style={{ whiteSpace: 'pre-wrap', margin: 0, fontFamily: 'inherit' }}>{renderValue(value)}</pre>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="d-flex gap-sm">
            <button type="button" className="btn btn-secondary" onClick={() => router.push('/audits')}>
              Retour à la liste
            </button>
            <DeleteActionButton
              onDelete={handleDelete}
              disabled={busy}
              itemName={`l'audit de ${audit.clientName}`}
              confirmMessage={`Supprimer définitivement l'audit de ${audit.clientName} ? Les réponses et les fichiers déposés seront effacés.`}
            />
          </div>
        </div>
      </PageContent>
    </PageContainer>
  )
}
