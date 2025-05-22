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
    const royaltysetItems = await prisma.nftItem.findMany({
      where: {
        nftResource: {
          status: 'ROYALTYSET'
        }
      },
      include: {
        item: {
          include: {
            user: {
              select: {
                email: true,
                firstName: true,
                lastName: true,
              }
            },
            physicalItem: true
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
      item: {
        ...item.item,
        physicalItem: item.item.physicalItem ? {
          ...item.item.physicalItem,
          height: item.item.physicalItem.height ? Number(item.item.physicalItem.height) : null,
          width: item.item.physicalItem.width ? Number(item.item.physicalItem.width) : null,
        } : null,
      },
      priceNftBeforeTax: null, // Ces propriétés seront à définir autrement
      pricePhysicalBeforeTax: null, // ou à supprimer si non nécessaires
      priceNftPlusPhysicalBeforeTax: null,
    }))

    return <MarketplaceListingClient royaltysetItems={serializedItems as any} smartContracts={smartContracts} />
  } catch (error) {
    console.error('Erreur lors de la récupération des données:', error)
    return <MarketplaceListingClient royaltysetItems={[]} smartContracts={[]} />
  }
} 