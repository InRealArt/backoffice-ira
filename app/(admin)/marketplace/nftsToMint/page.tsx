import { prisma } from '@/lib/prisma'
import ProductListingClient from './NftsToMintClient'

export const metadata = {
  title: 'Demandes de listing produits | Marketplace',
  description: 'Gérez les demandes de listing de produits dans le marketplace',
}

export default async function NftsToMintPage() {
  try {
    // Récupération des items avec les relations user et nftResource
    const products = await prisma.item.findMany({
      where: {
        OR: [
          {
            nftResource: {
              status: {
                not: {
                  in: ['MINED', 'LISTED', 'SOLD']
                }
              }
            }
          },
          {
            nftResource: null
          }
        ]
      },
      orderBy: {
        id: 'desc',
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
            mockups: true,
            tags: true,
          }
        }
      }
    }) || []

    return <ProductListingClient products={products} />
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error)
    // En cas d'erreur, renvoyer un tableau vide
    return <ProductListingClient products={[]} />
  }
}