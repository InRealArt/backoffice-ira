import DetailedFaqPageClient from './DetailedFaqPageClient'
import { DetailedFaqPage, DetailedFaqPageItem } from '@prisma/client'
import { getDetailedFaqPages } from '@/lib/actions/faq-page-actions'

// Définir l'interface pour les données incluant faqItems
interface DetailedFaqPageWithItems extends DetailedFaqPage {
  faqItems: DetailedFaqPageItem[]
}

export const metadata = {
  title: 'Liste des FAQ par page | Administration',
  description: 'Gérez les FAQ par page du site',
}

export default async function DetailedFaqPagePage() {
  let faqPages: DetailedFaqPageWithItems[] = []
  
  try {
    faqPages = await getDetailedFaqPages() as DetailedFaqPageWithItems[]
  } catch (error) {
    console.error('Erreur lors de la récupération des FAQ par page:', error)
  }

  return <DetailedFaqPageClient faqPages={faqPages} />
} 