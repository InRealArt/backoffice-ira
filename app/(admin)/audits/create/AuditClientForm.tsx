'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createAuditClient } from '@/lib/actions/audit-client-actions'
import { useToast } from '@/app/components/Toast/ToastContext'
import AuditLinkBox from '../AuditLinkBox'

export default function AuditClientForm() {
  const router = useRouter()
  const { error: showError } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [created, setCreated] = useState<{ id: string; link: string } | null>(null)

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const form = new FormData(event.currentTarget)
    const text = (name: string) => String(form.get(name) ?? '').trim()
    const dateOrNull = (name: string) => text(name) || null

    setIsSubmitting(true)
    try {
      const result = await createAuditClient({
        clientName: text('clientName'),
        clientEmail: text('clientEmail'),
        auditorName: text('auditorName'),
        paymentType: text('paymentType') as 'DEPOSIT' | 'FULL',
        paidAt: dateOrNull('paidAt'),
        dueDate: text('dueDate'),
        expiresAt: dateOrNull('expiresAt'),
      })
      if (result.success) {
        setCreated({ id: result.id, link: result.link })
      } else {
        showError(result.message)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (created) {
    return (
      <div className="form-container">
        <div className="form-card">
          <div className="card-header">
            <h2 className="card-title">Audit créé</h2>
          </div>
          <div className="card-content">
            <AuditLinkBox link={created.link} />
            <div className="d-flex gap-sm" style={{ marginTop: '1rem' }}>
              <button type="button" className="btn btn-primary" onClick={() => router.push(`/audits/${created.id}`)}>
                Voir l&apos;audit
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => router.push('/audits')}>
                Retour à la liste
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="form-container">
      <div className="form-card">
        <div className="card-header">
          <h2 className="card-title">Client</h2>
        </div>
        <div className="card-content">
          <div className="form-group">
            <label htmlFor="clientName" className="form-label">Nom du client *</label>
            <input id="clientName" name="clientName" type="text" required maxLength={255} className="form-input" disabled={isSubmitting} />
          </div>
          <div className="form-group">
            <label htmlFor="clientEmail" className="form-label">E-mail du client *</label>
            <input id="clientEmail" name="clientEmail" type="email" required maxLength={255} className="form-input" disabled={isSubmitting} />
          </div>
          <div className="form-group">
            <label htmlFor="auditorName" className="form-label">Auditeur</label>
            <input id="auditorName" name="auditorName" type="text" maxLength={255} className="form-input" disabled={isSubmitting} />
          </div>
        </div>
      </div>

      <div className="form-card">
        <div className="card-header">
          <h2 className="card-title">Paiement et échéance</h2>
        </div>
        <div className="card-content">
          <div className="form-group">
            <label htmlFor="paymentType" className="form-label">Type de paiement *</label>
            <select id="paymentType" name="paymentType" required defaultValue="DEPOSIT" className="form-input" disabled={isSubmitting}>
              <option value="DEPOSIT">Acompte</option>
              <option value="FULL">Totalité</option>
            </select>
          </div>
          <div className="form-group">
            <label htmlFor="paidAt" className="form-label">Date du paiement</label>
            <input id="paidAt" name="paidAt" type="date" className="form-input" disabled={isSubmitting} />
          </div>
          <div className="form-group">
            <label htmlFor="dueDate" className="form-label">À retourner avant le *</label>
            <input id="dueDate" name="dueDate" type="date" required className="form-input" disabled={isSubmitting} />
          </div>
          <div className="form-group">
            <label htmlFor="expiresAt" className="form-label">Expiration du lien</label>
            <input id="expiresAt" name="expiresAt" type="date" className="form-input" disabled={isSubmitting} />
            <p className="form-hint text-xs">Par défaut : échéance + 30 jours.</p>
          </div>
        </div>
      </div>

      <div className="d-flex gap-sm">
        <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
          {isSubmitting ? 'Création…' : "Créer l'audit"}
        </button>
        <button type="button" className="btn btn-secondary" onClick={() => router.push('/audits')} disabled={isSubmitting}>
          Annuler
        </button>
      </div>
    </form>
  )
}
