import { getAllAuditClients } from '@/lib/actions/audit-client-actions'
import AuditClientsClient from './AuditClientsClient'

export const metadata = {
  title: 'Audits clients | Administration',
  description: 'Suivi des audits de carrière payants',
}

export default async function AuditClientsPage() {
  const audits = await getAllAuditClients()
  return <AuditClientsClient audits={audits} />
}
