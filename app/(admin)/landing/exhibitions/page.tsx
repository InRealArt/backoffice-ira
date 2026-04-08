import { getAllExhibitions } from '@/lib/actions/exhibition-actions'
import ExhibitionsClient from './ExhibitionsClient'

export const metadata = {
  title: 'Expositions | Administration',
  description: 'Gérez les expositions affichées sur le site',
}

export default async function ExhibitionsPage() {
  const exhibitions = await getAllExhibitions()
  return <ExhibitionsClient exhibitions={exhibitions} />
}
