import { notFound } from 'next/navigation'
import { getAgencyEventById } from '@/lib/actions/agency-event-actions'
import AgencyEventForm from '../../AgencyEventForm'

export const metadata = {
  title: 'Modifier un événement agence | Administration',
  description: "Modification d'un événement agence existant",
}

interface EditAgencyEventPageProps {
  params: Promise<{ id: string }>
}

export default async function EditAgencyEventPage({ params }: EditAgencyEventPageProps) {
  const { id } = await params
  const agencyEventId = parseInt(id, 10)

  if (isNaN(agencyEventId)) {
    notFound()
  }

  const agencyEvent = await getAgencyEventById(agencyEventId)

  if (!agencyEvent) {
    notFound()
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Modifier un événement agence</h1>
        <p className="page-subtitle">Modification de : {agencyEvent.name}</p>
      </div>

      <div className="page-content">
        <AgencyEventForm mode="edit" agencyEvent={agencyEvent} />
      </div>
    </div>
  )
}
