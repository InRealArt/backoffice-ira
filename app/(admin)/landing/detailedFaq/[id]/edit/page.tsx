import { notFound } from 'next/navigation'
import { getDetailedFaqHeaders } from '@/lib/actions/faq-actions'
import DetailedFaqEditForm from './DetailedFaqEditForm'

export const metadata = {
  title: 'Éditer une FAQ détaillée | Administration',
  description: 'Modifier une FAQ détaillée et ses questions',
}

export default async function EditDetailedFaqPage({ params }: { params: { id: string } }) {
  // Récupérer l'ID depuis les paramètres
  const id = parseInt(params.id)

  if (isNaN(id)) {
    return notFound()
  }

  // Récupérer toutes les FAQ détaillées puis filtrer celle correspondant à l'ID
  const faqHeaders = await getDetailedFaqHeaders()
  const faqHeader = faqHeaders.find(header => header.id === id)

  if (!faqHeader) {
    return notFound()
  }

  return <DetailedFaqEditForm faqHeader={faqHeader} />
} 