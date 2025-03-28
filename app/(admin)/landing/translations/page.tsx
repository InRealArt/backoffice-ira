import { prisma } from '@/lib/prisma'
import TranslationsClient from './TranslationsClient'
import { Translation } from '@prisma/client'

export const metadata = {
  title: 'Liste des traductions | Administration',
  description: 'Gérez les traductions enregistrées dans le système',
}

export default async function TranslationsPage() {
  let translations: Translation[] = []
  
  try {
    translations = await prisma.translation.findMany({
      orderBy: {
        id: 'asc',
      },
      include: {
        language: true
      }
    }) || []
  } catch (error) {
    console.error('Erreur lors de la récupération des traductions:', error)
  }

  return <TranslationsClient translations={translations} />
} 