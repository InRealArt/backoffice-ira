import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import EditCollectionForm from './EditCollectionForm'


export const metadata = {
  title: 'Modifier une collection | Blockchain',
  description: 'Modification des détails d\'une collection de NFT',
}

interface EditCollectionPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EditCollectionPage({ params }: EditCollectionPageProps) {
  const { id } = await params
  const collectionId = parseInt(id)
  
  if (isNaN(collectionId)) {
    notFound()
  }
  
  // Récupérer la collection avec ses relations
  const collection = await prisma.nftCollection.findUnique({
    where: { id: collectionId },
    include: {
      artist: true,
      smartContract: true,
    },
  })
  
  if (!collection) {
    notFound()
  }
  
  // Récupérer tous les artistes et factories pour les sélecteurs
  const artists = await prisma.artist.findMany({
    orderBy: { pseudo: 'asc' }
  })
  
  const smartContracts = await prisma.smartContract.findMany({
    orderBy: { id: 'asc' }
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Modifier la collection</h1>
      <EditCollectionForm 
        collection={collection} 
        artists={artists} 
        smartContracts={smartContracts} 
      />
    </div>
  )
} 