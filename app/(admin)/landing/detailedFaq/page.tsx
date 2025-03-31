import DetailedFaqClient from './DetailedFaqClient'
import { DetailedFaqHeader, DetailedFaqItem } from '@prisma/client'
import { getDetailedFaqHeaders } from '@/lib/actions/faq-actions'

// Définir l'interface pour les données incluant faqItems
interface DetailedFaqHeaderWithItems extends DetailedFaqHeader {
  faqItems: DetailedFaqItem[]
}

export const metadata = {
  title: 'Liste des FAQ détaillées | Administration',
  description: 'Gérez les FAQ détaillées du site',
}

export default async function DetailedFaqPage() {
  let faqHeaders: DetailedFaqHeaderWithItems[] = []
  
  try {
    faqHeaders = await getDetailedFaqHeaders() as DetailedFaqHeaderWithItems[]
  } catch (error) {
    console.error('Erreur lors de la récupération des FAQ détaillées:', error)
  }

  return <DetailedFaqClient faqHeaders={faqHeaders} />
}