import { getAllAgencyEvents } from '@/lib/actions/agency-event-actions'
import AgencyEventsClient from './AgencyEventsClient'

export const metadata = {
  title: 'Événements agence | Administration',
  description: "Gérez les événements de l'agence affichés sur le site",
}

export default async function AgencyEventsPage() {
  const agencyEvents = await getAllAgencyEvents()
  return <AgencyEventsClient agencyEvents={agencyEvents} />
}
