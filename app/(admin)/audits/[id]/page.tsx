import { notFound } from 'next/navigation'
import { getAuditClientById } from '@/lib/actions/audit-client-actions'
import AuditClientDetailClient from './AuditClientDetailClient'

export const metadata = {
  title: 'Détail audit | Administration',
  description: "Réponses et gestion du lien d'un audit client",
}

export default async function AuditClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const audit = await getAuditClientById(id)
  if (!audit) notFound()
  return <AuditClientDetailClient audit={audit} />
}
