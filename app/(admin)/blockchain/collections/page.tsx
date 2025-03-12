import { prisma } from '@/lib/prisma'
import CollectionsClient from './CollectionsClient'
import CollectionSyncButton from '@/app/components/Blockchain/CollectionSyncButton'


export const metadata = {
  title: 'Liste des collections | Blockchain',
  description: 'Gérez les collections enregistrées dans le système',
}

export default async function CollectionsPage() {
  const collections = await prisma.nftCollection.findMany({
    orderBy: {
      symbol: 'asc',
    },
    include: {
      artist: true,
      smartContract: true,
    },
  })

  const smartContracts = await prisma.smartContract.findMany({
    orderBy: {
      id: 'asc',
    },
  })

  return (
    <div>
      
      {/* Liste des collections */}
      <CollectionsClient collections={collections} smartContracts={smartContracts} />
    </div>
  )
} 