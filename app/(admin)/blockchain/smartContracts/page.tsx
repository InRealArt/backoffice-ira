import { prisma } from '@/lib/prisma'
import SmartContractsClient from './SmartContractsClient'


export const metadata = {
  title: 'Liste des smart contracts | Blockchain',
  description: 'Gérez les smart contracts déployés dans le système',
}

export default async function SmartContractsPage() {
  const smartContracts = await prisma.smartContract.findMany({
    orderBy: {
      id: 'asc',
    },
  }).catch(error => {
    console.error('Erreur lors de la récupération des smart contracts:', error)
    return []
  })

  return <SmartContractsClient smartContracts={smartContracts || []} />
} 