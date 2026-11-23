import AuditClientForm from './AuditClientForm'

export const metadata = {
  title: 'Nouvel audit | Administration',
  description: "Créer un audit client et son lien privé",
}

export default function CreateAuditClientPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Nouvel audit client</h1>
        <p className="page-subtitle">Le lien privé n&apos;est affiché qu&apos;une seule fois, à la création</p>
      </div>
      <AuditClientForm />
    </div>
  )
}
