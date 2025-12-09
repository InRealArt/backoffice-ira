'use server'

import { prisma } from '@/lib/prisma'
import { getBackofficeUserByEmail } from '@/lib/actions/prisma-actions'

/**
 * Récupère le nombre de vues depuis PhysicalArtworkView pour plusieurs artworks
 * @param artworkIds - Tableau des IDs des PhysicalItem (BigInt)
 * @returns Map avec artworkId comme clé et le nombre de vues comme valeur
 */
async function getViewsCountForArtworks(artworkIds: bigint[]): Promise<Map<bigint, number>> {
    if (artworkIds.length === 0) {
        return new Map()
    }

    try {
        console.log('[getViewsCountForArtworks] Recherche de vues pour', artworkIds.length, 'artworks')
        console.log('[getViewsCountForArtworks] IDs:', artworkIds.map(id => id.toString()))

        // Utiliser une requête SQL brute car Prisma peut avoir des problèmes avec les schémas multi-schema
        // Construire la liste des IDs pour la clause IN
        const idsString = artworkIds.map(id => id.toString()).join(',')

        const viewsCount = await prisma.$queryRawUnsafe<Array<{
            artworkId: bigint
            count: bigint
        }>>(`
            SELECT 
                "artworkId",
                COUNT(*)::BIGINT as count
            FROM statistics."PhysicalArtworkView"
            WHERE "artworkId" = ANY(ARRAY[${idsString}]::BIGINT[])
            GROUP BY "artworkId"
        `)

        console.log('[getViewsCountForArtworks] Résultats trouvés:', viewsCount.length)
        viewsCount.forEach((item) => {
            console.log(`[getViewsCountForArtworks] Artwork ${item.artworkId.toString()}: ${item.count.toString()} vues`)
        })

        const viewsMap = new Map<bigint, number>()
        viewsCount.forEach((item) => {
            // S'assurer que artworkId est bien un BigInt
            const artworkId = typeof item.artworkId === 'bigint' ? item.artworkId : BigInt(item.artworkId)
            const count = typeof item.count === 'bigint' ? Number(item.count) : Number(item.count)
            viewsMap.set(artworkId, count)
        })

        // S'assurer que tous les artworks ont une entrée (même avec 0 vues)
        artworkIds.forEach((id) => {
            if (!viewsMap.has(id)) {
                console.log(`[getViewsCountForArtworks] Aucune vue trouvée pour artwork ${id.toString()}, valeur par défaut: 0`)
                viewsMap.set(id, 0)
            }
        })

        return viewsMap
    } catch (error) {
        console.error('[getViewsCountForArtworks] Erreur lors de la récupération des vues:', error)
        // En cas d'erreur, retourner 0 pour tous les artworks
        const viewsMap = new Map<bigint, number>()
        artworkIds.forEach((id) => {
            viewsMap.set(id, 0)
        })
        return viewsMap
    }
}

export type ItemData = {
    id: number
    name: string
    tags: string[]
    mainImageUrl: string
    description: string
    metaTitle: string
    metaDescription: string
    createdAt: string // ISO date string for client-side formatting
    physicalItem?: {
        id: number
        status: string
        price: number
        realViewCount?: number
        fakeViewCount?: number
        commercialStatus?: string
        physicalCollection?: {
            id: number
            name: string
        } | null
    } | null
    nftItem?: {
        id: number
        status: string
        price: number
    } | null
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
                tags: true,
                mainImageUrl: true, // Sélectionner explicitement mainImageUrl
                description: true,
                metaTitle: true,
                metaDescription: true,
                createdAt: true,
                physicalItem: {
                    select: {
                        id: true,
                        status: true,
                        price: true,
                        realViewCount: true,
                        fakeViewCount: true,
                        commercialStatus: true,
                        physicalCollection: {
                            select: {
                                id: true,
                                name: true
                            }
                        }
                    }
                }
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

        // Récupérer les IDs des PhysicalItem pour récupérer les vues
        const physicalItemIds = items
            .filter((it) => it.physicalItem)
            .map((it) => {
                // S'assurer que l'ID est converti en BigInt correctement
                const id = it.physicalItem!.id
                return typeof id === 'bigint' ? id : BigInt(id)
            })

        console.log('[fetchItemsData] Nombre de PhysicalItem trouvés:', physicalItemIds.length)
        console.log('[fetchItemsData] IDs des PhysicalItem:', physicalItemIds.map(id => id.toString()))

        // Récupérer le nombre de vues depuis PhysicalArtworkView
        const viewsMap = await getViewsCountForArtworks(physicalItemIds)

        return {
            success: true,
            data: items.map((it) => {
                // S'assurer que la conversion est cohérente avec celle utilisée pour créer la Map
                const physicalItemId = it.physicalItem
                    ? (typeof it.physicalItem.id === 'bigint' ? it.physicalItem.id : BigInt(it.physicalItem.id))
                    : null
                const realViewsCount = physicalItemId ? (viewsMap.get(physicalItemId) ?? 0) : 0

                console.log(`[fetchItemsData] Item ${it.id}: PhysicalItem ID ${physicalItemId?.toString()}, Vues: ${realViewsCount}`)

                const item = {
                    ...it,
                    // Normaliser createdAt en string pour la sérialisation côté client
                    createdAt: (it as any).createdAt instanceof Date ? (it as any).createdAt.toISOString() : (it as any).createdAt,
                    // S'assurer que physicalItem est correctement sérialisé
                    physicalItem: it.physicalItem ? {
                        ...it.physicalItem,
                        id: Number(it.physicalItem.id), // Convertir BigInt en number
                        commercialStatus: it.physicalItem.commercialStatus || 'AVAILABLE',
                        // Remplacer realViewCount par le nombre réel depuis PhysicalArtworkView
                        realViewCount: realViewsCount,
                        // S'assurer que physicalCollection est inclus et correctement sérialisé
                        physicalCollection: it.physicalItem.physicalCollection ? {
                            id: it.physicalItem.physicalCollection.id,
                            name: it.physicalItem.physicalCollection.name
                        } : null
                    } : null
                }
                return item
            }) as ItemData[]
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des items:', error)
        return {
            success: false,
            error: 'Erreur lors de la récupération de vos œuvres'
        }
    }
}

/**
 * Récupère les statistiques mensuelles de vues pour un PhysicalItem
 * @param physicalItemId - ID du PhysicalItem (BigInt)
 * @returns Tableau des stats mensuelles triées par année et mois
 */
export async function getMonthlyViewStats(physicalItemId: bigint): Promise<Array<{
    year: number
    month: number
    viewCount: number
    monthLabel: string
}>> {
    try {
        const stats = await prisma.$queryRawUnsafe<Array<{
            year: number
            month: number
            viewCount: bigint
        }>>(`
            SELECT 
                "year",
                "month",
                "viewCount"::BIGINT as "viewCount"
            FROM statistics."PhysicalArtworkViewStat"
            WHERE "artworkId" = ${physicalItemId.toString()}
            ORDER BY "year" DESC, "month" DESC
        `)

        // Formater les données avec un label de mois
        const monthNames = [
            'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
            'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
        ]

        return stats.map((stat) => ({
            year: stat.year,
            month: stat.month,
            viewCount: Number(stat.viewCount),
            monthLabel: `${monthNames[stat.month - 1]} ${stat.year}`
        }))
    } catch (error) {
        console.error('[getMonthlyViewStats] Erreur lors de la récupération des stats:', error)
        return []
    }
}

/**
 * Récupère l'ID du PhysicalItem depuis l'itemId
 * @param itemId - ID de l'Item
 * @returns ID du PhysicalItem (BigInt) ou null
 */
export async function getPhysicalItemIdByItemId(itemId: number): Promise<bigint | null> {
    try {
        const physicalItem = await prisma.physicalItem.findUnique({
            where: { itemId },
            select: { id: true }
        })

        if (!physicalItem) {
            return null
        }

        return typeof physicalItem.id === 'bigint' ? physicalItem.id : BigInt(physicalItem.id)
    } catch (error) {
        console.error('[getPhysicalItemIdByItemId] Erreur:', error)
        return null
    }
}

