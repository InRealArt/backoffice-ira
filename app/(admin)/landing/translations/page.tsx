import { prisma } from '@/lib/prisma'
import TranslationsClient from './TranslationsClient'
import { Translation } from '@prisma/client'

// Définir l'interface pour correspondre à celle du composant client
interface TranslationWithLanguage extends Translation {
  language: {
    id: number
    name: string
    code: string
  }
}

export const metadata = {
  title: 'Liste des traductions | Administration',
  description: 'Gérez les traductions enregistrées dans le système',
}

export default async function TranslationsPage() {
  let translations: TranslationWithLanguage[] = []
  
  try {
    // Typer explicitement le résultat comme TranslationWithLanguage[]
    translations = await prisma.translation.findMany({
      orderBy: {
        id: 'asc',
      },
      include: {
        language: true
      }
    }) as TranslationWithLanguage[]
  } catch (error) {
    console.error('Erreur lors de la récupération des traductions:', error)
  }

  return <TranslationsClient translations={translations} />
} 