import { prisma } from '@/lib/prisma'
import MarketplaceListingClient from './MarketplaceListingClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Listing Marketplace | Marketplace',
  description: 'Listez des œuvres sur la marketplace',
}

export default async function MarketplaceListingPage() {
  try {
    // Récupération des smart contracts disponibles
    const smartContracts = await prisma.smartContract.findMany({
      orderBy: {
        id: 'desc'
      }
    }) || []

    // Récupération des items avec statut ROYALTYSET et leurs relations
    const royaltysetItems = []

    // Conversion des objets Decimal en nombres standard
    const serializedItems = []

    return <MarketplaceListingClient royaltysetItems={[]} smartContracts={smartContracts} />
  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error)
    return <MarketplaceListingClient royaltysetItems={[]} smartContracts={[]} />
  }
} 