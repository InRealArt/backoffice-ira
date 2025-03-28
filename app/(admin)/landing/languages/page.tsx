import { prisma } from '@/lib/prisma'
import LanguagesClient from './LanguagesClient'
import { Language } from '@prisma/client'

export const metadata = {
  title: 'Liste des langues | Administration',
  description: 'Gérez les langues disponibles pour le contenu multilingue',
}

export default async function LanguagesPage() {
  let languages: Language[] = []
  
  try {
    languages = await prisma.language.findMany({
      orderBy: {
        name: 'asc',
      },
    }) || []
  } catch (error) {
    console.error('Erreur lors de la récupération des langues:', error)
  }

  return <LanguagesClient languages={languages} />
} 