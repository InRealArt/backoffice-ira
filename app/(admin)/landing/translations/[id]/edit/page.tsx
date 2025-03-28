import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import TranslationEditForm from './TranslationEditForm'

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
  
  // Récupérer les modèles Prisma du schéma landing (sauf Translation et Language)
  const models = await getSchemaModels()
  
  return <TranslationEditForm 
    translation={translation} 
    languages={languages} 
    models={models} 
  />
}

// Fonction pour récupérer les modèles du schéma Prisma 'landing'
async function getSchemaModels() {
  // Liste des modèles du schéma 'landing', excluant Translation et Language
  const landingModels = [
    {
      name: 'Team',
      fields: [
        { name: 'firstName', type: 'String' },
        { name: 'lastName', type: 'String' },
        { name: 'email', type: 'String' },
        { name: 'role', type: 'String' },
        { name: 'intro', type: 'String' },
        { name: 'description', type: 'String' },
        { name: 'photoUrl1', type: 'String' },
        { name: 'photoUrl2', type: 'String' },
        { name: 'linkedinUrl', type: 'String' },
        { name: 'instagramUrl', type: 'String' },
        { name: 'facebookUrl', type: 'String' },
        { name: 'githubUrl', type: 'String' },
        { name: 'twitterUrl', type: 'String' },
        { name: 'websiteUrl', type: 'String' }
      ]
    },
    {
      name: 'Faq',
      fields: [
        { name: 'question', type: 'String' },
        { name: 'answer', type: 'String' }
      ]
    }
    // Ajoutez d'autres modèles du schéma 'landing' si nécessaire
  ]
  
  return landingModels
} 