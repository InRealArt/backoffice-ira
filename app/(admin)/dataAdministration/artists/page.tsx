import { prisma } from '@/lib/prisma'
import ArtistsClient from './ArtistsClient'
import { loadArtistsSearchParams } from './searchParams'
import type { SearchParams } from 'nuqs/server'

export const metadata = {
  title: 'Liste des artistes | Blockchain',
  description: 'Gérez les artistes enregistrés dans le système',
}

type PageProps = {
  searchParams: Promise<SearchParams>
}

export default async function ArtistsPage({ searchParams }: PageProps) {
  // Charger les paramètres de recherche côté serveur
  const { name } = await loadArtistsSearchParams(searchParams)
  
  // Construire la condition de filtrage
  const where = name
    ? {
        OR: [
          { name: { contains: name, mode: 'insensitive' as const } },
          { surname: { contains: name, mode: 'insensitive' as const } },
          { pseudo: { contains: name, mode: 'insensitive' as const } }
        ]
      }
    : {}

  const artists = await prisma.artist.findMany({
    where,
    orderBy: {
      name: 'asc',
    },
  })

  return <ArtistsClient artists={artists} />
} 