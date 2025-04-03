import { prisma } from '@/lib/prisma'
import NewTranslationForm from './NewTranslationForm'
import { getSchemaModels } from '@/lib/schema-models'

export const metadata = {
  title: 'Ajouter une traduction | Administration',
  description: 'Formulaire d\'ajout d\'une nouvelle traduction'
}

export default async function NewTranslationPage() {
  const languages = await prisma.language.findMany({
    orderBy: {
      name: 'asc'
    }
  })
  
  // Récupérer les modèles Prisma du schéma landing
  const models = await getSchemaModels()
  
  return <NewTranslationForm languages={languages} models={models} />
} 