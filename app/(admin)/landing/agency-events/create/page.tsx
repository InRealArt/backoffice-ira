import AgencyEventForm from '../AgencyEventForm'

export const metadata = {
  title: 'Nouvel événement agence | Administration',
  description: 'Créer un nouvel événement agence',
}

export default function CreateAgencyEventPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Nouvel événement agence</h1>
        <p className="page-subtitle">Ajoutez un nouvel événement agence au site</p>
      </div>

      <div className="page-content">
        <AgencyEventForm mode="create" />
      </div>
    </div>
  )
}
