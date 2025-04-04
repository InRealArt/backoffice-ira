import { notFound } from 'next/navigation'
import { getDetailedGlossaryHeaders } from '@/lib/actions/glossary-actions'
import DetailedGlossaryEditForm from './DetailedGlossaryEditForm'

export const metadata = {
  title: 'Éditer un Glossaire détaillé | Administration',
  description: 'Modifier un Glossaire détaillé et ses questions',
}

export default async function EditDetailedGlossaryPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  // Récupérer l'ID depuis les paramètres
  const id = parseInt(resolvedParams.id)

  if (isNaN(id)) {
    return notFound()
  }

  // Récupérer toutes les Glossaire détaillées puis filtrer celle correspondant à l'ID
  const glossaryHeaders = await getDetailedGlossaryHeaders()
  const glossaryHeader = glossaryHeaders.find(header => header.id === id)

  if (!glossaryHeader) {
    return notFound()
  }

  return <DetailedGlossaryEditForm glossaryHeader={glossaryHeader} />
} 