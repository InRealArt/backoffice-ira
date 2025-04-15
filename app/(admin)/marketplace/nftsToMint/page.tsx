import { prisma } from '@/lib/prisma'
import NftsToMintClient from './NftsToMintClient'

// Force la route à être dynamique
export const dynamic = 'force-dynamic'
// Désactive le cache de la route
export const revalidate = 0

export const metadata = {
  title: 'Demandes de listing produits | Marketplace',
  description: 'Gérez les demandes de listing de produits dans le marketplace',
}

export default async function NftsToMintPage() {
  try {
    // Récupération des items avec les relations user et nftResource
    const productsRaw = await prisma.item.findMany({
      where: {
        OR: [
          {
            nftResource: {
              status: {
                not: {
                  in: ['MINED', 'LISTED', 'ROYALTYSET', 'SOLD']
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
            collection: {
              select: {
                name: true,
                smartContract: {
                  select: {
                    active: true,
                    factoryAddress: true
                  }
                }
              }
            }
          }
        }
      }
    }) || []

    // Sérialisation des objets Decimal en chaînes de caractères
    const products = productsRaw.map(product => ({
      ...product,
      height: product.height ? product.height.toString() : null,
      width: product.width ? product.width.toString() : null,
      // Sérialiser d'autres champs Decimal si nécessaire
    }))

    return <NftsToMintClient products={products} />
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error)
    // En cas d'erreur, renvoyer un tableau vide
    return <NftsToMintClient products={[]} />
  }
}