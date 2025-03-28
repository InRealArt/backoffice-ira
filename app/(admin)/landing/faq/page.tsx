import { prisma } from '@/lib/prisma'
import FaqClient from './FaqClient'
import { Faq } from '@prisma/client'

export const metadata = {
  title: 'Liste des FAQs | Administration',
  description: 'Gérez les questions fréquemment posées du site',
}

export default async function FaqPage() {
  let faqs: Faq[] = []
  
  try {
    faqs = await prisma.faq.findMany({
      orderBy: {
        id: 'asc',
      },
    }) || []
  } catch (error) {
    console.error('Erreur lors de la récupération des FAQs:', error)
  }

  return <FaqClient faqs={faqs} />
} 