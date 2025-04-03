import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import TranslationEditForm from './TranslationEditForm'
import { getSchemaModels } from '@/lib/schema-models'

export const metadata = {
  title: 'Modifier une traduction | Administration',
  description: 'Modifier les informations d\'une traduction existante'
}

export default async function EditTranslationPage({ params }: { params: { id: string } }) {
  const awaitedParams = await params
  
  if (!awaitedParams.id || isNaN(parseInt(awaitedParams.id))) {
    notFound()
  }
  
  const translationId = parseInt(awaitedParams.id)
  
  const translation = await prisma.translation.findUnique({
    where: { 
      id: translationId 
    },
    include: {
      language: true
    }
  })
  
  if (!translation) {
    notFound()
  }
  
  const languages = await prisma.language.findMany({
    orderBy: {
      name: 'asc'
    }
  })
  
  // Récupérer les modèles Prisma du schéma landing
  const models = await getSchemaModels()
  
  return <TranslationEditForm 
    translation={translation} 
    languages={languages} 
    models={models} 
  />
} 