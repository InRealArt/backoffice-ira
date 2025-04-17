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
    const royaltysetItems = await prisma.item.findMany({
      where: {
        nftResource: {
          status: 'ROYALTYSET'
        }
      },
      include: {
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          }
        },
        nftResource: {
          select: {
            name: true,
            status: true,
            type: true,
            imageUri: true,
            certificateUri: true,
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
                    network: true
                  }
                }
              }
            }
          }
        }
      }
    }) || []

    // Conversion des objets Decimal en nombres standard
    const serializedItems = royaltysetItems.map(item => ({
      ...item,
      height: item.height ? Number(item.height) : null,
      width: item.width ? Number(item.width) : null,
      priceNftBeforeTax: item.priceNftBeforeTax ? Number(item.priceNftBeforeTax) : null,
      pricePhysicalBeforeTax: item.pricePhysicalBeforeTax ? Number(item.pricePhysicalBeforeTax) : null,
      priceNftPlusPhysicalBeforeTax: item.priceNftPlusPhysicalBeforeTax ? Number(item.priceNftPlusPhysicalBeforeTax) : null,
    }))

    return <MarketplaceListingClient royaltysetItems={serializedItems as any} smartContracts={smartContracts} />
  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error)
    return <MarketplaceListingClient royaltysetItems={[]} smartContracts={[]} />
  }
} 