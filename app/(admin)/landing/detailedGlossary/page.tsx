import DetailedGlossaryClient from './DetailedGlossaryClient'
import { DetailedFaqHeader, DetailedGlossaryHeader, DetailedGlossaryItem } from '@prisma/client'
import { getDetailedGlossaryHeaders } from '@/lib/actions/glossary-actions'

// Définir l'interface pour les données incluant faqItems
interface DetailedGlossaryHeaderWithItems extends DetailedGlossaryHeader {
  glossaryItems: DetailedGlossaryItem[]
}

export const metadata = {
  title: 'Liste des Glossary détaillées | Administration',
  description: 'Gérez les Glossary détaillées du site',
}

export default async function DetailedGlossaryPage() {
  let glossaryHeaders: DetailedGlossaryHeaderWithItems[] = []
  
  try {
    glossaryHeaders = await getDetailedGlossaryHeaders() as DetailedGlossaryHeaderWithItems[]
  } catch (error) {
    console.error('Erreur lors de la récupération des Glossary détaillées:', error)
  }

  return <DetailedGlossaryClient glossaryHeaders={glossaryHeaders} />
}