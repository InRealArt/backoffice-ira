import { prisma } from '@/lib/prisma'
import NftsToMintClient from './NftsToMintClient'
import { Decimal } from '@prisma/client/runtime/library'

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

    // Fonction pour sérialiser correctement un objet (y compris les dates)
    const serializeData = (obj: any): any => {
      if (obj === null || obj === undefined) {
        return obj
      }
      
      if (Array.isArray(obj)) {
        return obj.map(item => serializeData(item))
      }
      
      if (obj instanceof Date) {
        return obj.toISOString()
      }
      
      if (obj instanceof Decimal) {
        return obj.toString()
      }
      
      if (typeof obj === 'object' && obj !== null) {
        const result: Record<string, any> = {}
        for (const key in obj) {
          if (Object.prototype.hasOwnProperty.call(obj, key)) {
            result[key] = serializeData(obj[key])
          }
        }
        return result
      }
      
      return obj
    }

    // Sérialisation complète des données pour éviter les problèmes de sérialisation
    const serializedProducts = serializeData(productsRaw)
    
    // Finalisation des transformations spécifiques
    const products = serializedProducts.map((product: any) => ({
      ...product,
      height: product.height ? String(product.height) : null,
      width: product.width ? String(product.width) : null,
    }))

    return <NftsToMintClient products={products} />
  } catch (error) {
    console.error('Erreur lors de la récupération des produits:', error)
    // En cas d'erreur, renvoyer un tableau vide
    return <NftsToMintClient products={[]} />
  }
}