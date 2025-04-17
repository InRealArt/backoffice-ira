import { prisma } from '@/lib/prisma'
import TransactionsClient from './TransactionsClient'

// Ne pas désactiver le cache, nous utilisons un bouton pour rafraîchir manuellement
// export const dynamic = 'force-dynamic'
// export const revalidate = 0

export const metadata = {
  title: 'Transactions Marketplace | Marketplace',
  description: 'Liste des transactions effectuées sur la marketplace',
}

export default async function TransactionsPage() {
  try {
    // Récupération des smart contracts disponibles
    const smartContracts = await prisma.smartContract.findMany({
      orderBy: {
        id: 'desc'
      }
    }) || []

    // Récupération des collections
    const collections = await prisma.nftCollection.findMany({
      orderBy: {
        id: 'desc'
      },
      select: {
        id: true,
        name: true,
        smartContractId: true
      }
    }) || []

    // Récupération des transactions marketplace avec leurs relations
    const transactions = await prisma.marketPlaceTransaction.findMany({
      orderBy: {
        created_at: 'desc'
      },
      include: {
        nftResource: {
          select: {
            id: true,
            name: true,
            status: true,
            tokenId: true,
            collection: {
              select: {
                id: true,
                name: true,
                smartContractId: true,
                smartContract: {
                  select: {
                    id: true,
                    active: true,
                    factoryAddress: true,
                    marketplaceAddress: true,
                    network: true
                  }
                }
              }
            }
          }
        }
      }
    }) || []

    // Conversion des objets Decimal en nombres standard pour les prix
    const serializedTransactions = transactions.map(transaction => ({
      ...transaction,
      price: transaction.price ? Number(transaction.price) : null,
    }))

    return (
      <TransactionsClient
        transactions={serializedTransactions as any} 
        smartContracts={smartContracts}
        collections={collections}
      />
    )
  } catch (error) {
    console.error('Erreur lors de la récupération des données de transactions:', error)
    return (
      <TransactionsClient 
        transactions={[]} 
        smartContracts={[]}
        collections={[]}
      />
    )
  }
} 