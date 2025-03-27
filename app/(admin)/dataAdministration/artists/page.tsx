import { prisma } from '@/lib/prisma'
import ArtistsClient from './ArtistsClient'


export const metadata = {
  title: 'Liste des artistes | Blockchain',
  description: 'Gérez les artistes enregistrés dans le système',
}

export default async function ArtistsPage() {
  const artists = await prisma.artist.findMany({
    orderBy: {
      name: 'asc',
    },
  })

  return <ArtistsClient artists={artists} />
} 