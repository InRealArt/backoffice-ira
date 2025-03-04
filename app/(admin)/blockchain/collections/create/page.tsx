import { prisma } from '@/lib/prisma'
import CreateCollectionForm from './CreateCollectionForm'

export const metadata = {
  title: 'Créer une collection | Blockchain',
  description: 'Ajouter une nouvelle collection de NFT dans le système',
}

export default async function CreateCollectionPage() {
  // Récupérer tous les artistes et factories pour les sélecteurs
  const artists = await prisma.artist.findMany({
    orderBy: { pseudo: 'asc' }
  })
  
  const factories = await prisma.factory.findMany({
    orderBy: { id: 'asc' }
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Créer une collection de NFT</h1>
      <CreateCollectionForm artists={artists} factories={factories} />
    </div>
  )
} 