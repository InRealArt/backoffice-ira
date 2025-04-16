'use server'

import { prisma } from '@/lib/prisma'
import { getBackofficeUserByEmail } from '@/lib/actions/prisma-actions'
import { getShopifyProductById } from '@/lib/actions/shopify-actions'

export type ItemData = {
    id: number
    status: string
    title?: string
    price?: string
    imageUrl?: string
    tags: string[]
    height?: string
    width?: string
    creationYear?: number | null
    artworkSupport?: string | null
}

export type ItemsDataResult = {
    success: boolean
    data?: ItemData[]
    error?: string
}

export async function fetchItemsData(email: string): Promise<ItemsDataResult> {
    try {
        // Récupérer l'utilisateur par email
        const user = await getBackofficeUserByEmail(email)

        if (!user) {
            return {
                success: false,
                error: 'Utilisateur non trouvé'
            }
        }

        // Récupérer tous les items de l'utilisateur
        const items = await prisma.item.findMany({
            where: {
                idUser: user.id
            },
            orderBy: {
                id: 'desc'
            }
        })

        if (!items || items.length === 0) {
            return {
                success: true,
                data: []
            }
        }

        // Enrichir les items avec les données Shopify
        const enrichedItems = await Promise.all(
            items.map(async (item) => {
                // Récupérer les infos supplémentaires depuis Shopify
                const shopifyProduct = await getShopifyProductById(item.id.toString())
                return {
                    id: item.id,
                    status: item.status,
                    title: shopifyProduct?.product?.title || 'Sans titre',
                    price: shopifyProduct?.product?.price || '0.00',
                    imageUrl: shopifyProduct?.product?.imageUrl || '/images/no-image.jpg',
                    tags: item.tags,
                    height: item.height?.toString() || undefined,
                    width: item.width?.toString() || undefined,
                    creationYear: item.creationYear,
                    artworkSupport: item.artworkSupport
                }
            })
        )

        return {
            success: true,
            data: enrichedItems as ItemData[]
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des items:', error)
        return {
            success: false,
            error: 'Erreur lors de la récupération de vos œuvres'
        }
    }
} 