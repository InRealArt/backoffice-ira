import { getShopifyUserByEmail } from '@/app/actions/prisma/prismaActions'
import {
    getShopifyCollectionByTitle,
    getShopifyCollectionProducts
} from '@/app/actions/shopify/shopifyActions'

// Types pour les retours de la fonction
export type CollectionProduct = {
    id: string
    title: string
    price: string
    currency: string
    imageUrl: string
}

export type CollectionData = {
    id: string
    title: string
    description: string
    products: CollectionProduct[]
}

export type CollectionDataResult =
    | { success: true; data: CollectionData }
    | { success: false; error: string }

/**
 * Récupère les données de collection d'un utilisateur à partir de son email
 * 
 * @param email - Email de l'utilisateur
 * @returns Un objet contenant soit les données de la collection, soit une erreur
 */
export async function fetchCollectionData(email: string): Promise<CollectionDataResult> {
    try {
        // 1. Récupérer les infos utilisateur
        const user = await getShopifyUserByEmail(email)
        if (!user || !user.firstName || !user.lastName) {
            return {
                success: false,
                error: 'Informations utilisateur incomplètes'
            }
        }

        // 2. Récupérer la collection avec la fonction de shopifyActions
        const collectionTitle = `${user.firstName} ${user.lastName}`.trim()
        const collectionResult = await getShopifyCollectionByTitle(collectionTitle)

        if (!collectionResult.success || !collectionResult.collection) {
            return {
                success: false,
                error: collectionResult.message || 'Collection non trouvée'
            }
        }

        // 3. Récupérer les produits de la collection
        const productsResult = await getShopifyCollectionProducts(collectionResult.collection.id)

        // 4. Construire et retourner l'objet résultat
        return {
            success: true,
            data: {
                id: collectionResult.collection.id,
                title: collectionResult.collection.title,
                description: collectionResult.collection.body_html,
                products: productsResult.success && Array.isArray(productsResult.products)
                    ? productsResult.products.map(product => ({
                        id: extractShopifyId(product.id),
                        title: product.title,
                        price: product.price || '0',
                        currency: product.currency || 'EUR',
                        imageUrl: product.imageUrl || ''
                    }))
                    : []
            }
        }
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
        return {
            success: false,
            error: 'Erreur lors du chargement des données'
        }
    }
}

/**
 * Extrait l'ID numérique d'un ID global Shopify
 * Convertit "gid://shopify/product/12345" en "12345"
 */
function extractShopifyId(globalId: string): string {
    // Si l'ID est déjà au format court, le retourner tel quel
    if (!globalId.includes('gid://')) return globalId

    // Extraire la dernière partie après le dernier slash
    const parts = globalId.split('/')
    return parts[parts.length - 1]
} 