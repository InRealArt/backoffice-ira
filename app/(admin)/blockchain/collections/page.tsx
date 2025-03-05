import { prisma } from '@/lib/prisma'
import CollectionsClient from './CollectionsClient'
import CollectionSyncButton from '@/app/components/Blockchain/CollectionSyncButton'


export const metadata = {
  title: 'Liste des collections | Blockchain',
  description: 'Gérez les collections enregistrées dans le système',
}

export default async function CollectionsPage() {
  const collections = await prisma.collection.findMany({
    orderBy: {
      symbol: 'asc',
    },
    include: {
      artist: true,
      factory: true,
    },
  })

  const factories = await prisma.factory.findMany({
    orderBy: {
      id: 'asc',
    },
  })

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Collections</h1>
        <div className="flex gap-4">
          <CollectionSyncButton />
          {/* Bouton de création ou autres actions existantes */}
        </div>
      </div>
      
      {/* Liste des collections */}
      <CollectionsClient collections={collections} factories={factories} />
    </div>
  )
} 