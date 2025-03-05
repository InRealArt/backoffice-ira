import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import EditCollectionForm from './EditCollectionForm'


export const metadata = {
  title: 'Modifier une collection | Blockchain',
  description: 'Modification des détails d\'une collection de NFT',
}

interface EditCollectionPageProps {
  params: {
    id: string
  }
}

export default async function EditCollectionPage({ params }: EditCollectionPageProps) {
  const id = parseInt(params.id)
  
  if (isNaN(id)) {
    notFound()
  }
  
  // Récupérer la collection avec ses relations
  const collection = await prisma.collection.findUnique({
    where: { id },
    include: {
      artist: true,
      factory: true,
    },
  })
  
  if (!collection) {
    notFound()
  }
  
  // Récupérer tous les artistes et factories pour les sélecteurs
  const artists = await prisma.artist.findMany({
    orderBy: { pseudo: 'asc' }
  })
  
  const factories = await prisma.factory.findMany({
    orderBy: { id: 'asc' }
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Modifier la collection</h1>
      <EditCollectionForm 
        collection={collection} 
        artists={artists} 
        factories={factories} 
      />
    </div>
  )
} 