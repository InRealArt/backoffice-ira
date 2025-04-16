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

        // Récupérer tous les items de l'utilisateur avec les champs nécessaires
        const items = await prisma.item.findMany({
            where: {
                idUser: user.id
            },
            select: {
                id: true,
                name: true,
                status: true,
                tags: true,
                height: true,
                width: true,
                creationYear: true,
                artworkSupport: true,
                mainImageUrl: true, // Sélectionner explicitement mainImageUrl
                description: true,
                metaTitle: true,
                metaDescription: true
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

                // Utiliser mainImageUrl du modèle Item s'il est disponible
                // Sinon, utiliser l'image de Shopify ou une image par défaut
                console.log('Item avec ID', item.id, 'a mainImageUrl:', item.mainImageUrl);
                const imageUrl = item.mainImageUrl || shopifyProduct?.product?.imageUrl || '/img/Logo_InRealArt.svg'

                return {
                    id: item.id,
                    status: item.status,
                    title: item.name || shopifyProduct?.product?.title || 'Sans titre',
                    price: shopifyProduct?.product?.price || '0.00',
                    imageUrl: imageUrl,
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