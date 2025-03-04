import { prisma } from '@/lib/prisma'
import FactoriesClient from './FactoriesClient'


export const metadata = {
  title: 'Liste des factories | Blockchain',
  description: 'Gérez les contrats factory déployés dans le système',
}

export default async function FactoriesPage() {
  const factories = await prisma.factory.findMany({
    orderBy: {
      id: 'asc',
    },
  })

  return <FactoriesClient factories={factories} />
} 