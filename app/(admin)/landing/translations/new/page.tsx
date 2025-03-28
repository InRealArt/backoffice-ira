import { prisma } from '@/lib/prisma'
import NewTranslationForm from './NewTranslationForm'

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
  
  // Récupérer les modèles Prisma du schéma landing (sauf Translation et Language)
  const models = await getSchemaModels()
  
  return <NewTranslationForm languages={languages} models={models} />
}

// Fonction pour récupérer les modèles du schéma Prisma 'landing'
async function getSchemaModels() {
  // Pour simuler la récupération des modèles, car il n'existe pas de méthode directe dans Prisma Client
  // En production, cela pourrait être implémenté autrement, par exemple avec prisma-json-schema-generator
  
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
    }
    // Ajoutez d'autres modèles du schéma 'landing' si nécessaire
  ]
  
  return landingModels
} 