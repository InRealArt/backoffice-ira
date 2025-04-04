import { notFound } from 'next/navigation'
import { getDetailedFaqHeaders } from '@/lib/actions/faq-actions'
import DetailedFaqEditForm from './DetailedFaqEditForm'

export const metadata = {
  title: 'Éditer une FAQ détaillée | Administration',
  description: 'Modifier une FAQ détaillée et ses questions',
}

export default async function EditDetailedFaqPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  // Récupérer l'ID depuis les paramètres
  const id = parseInt(resolvedParams.id)

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