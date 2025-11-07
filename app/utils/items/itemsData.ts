'use server'

import { prisma } from '@/lib/prisma'
import { getBackofficeUserByEmail } from '@/lib/actions/prisma-actions'

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
                        fakeViewCount: true
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

        return {
            success: true,
            data: items.map((it) => ({
                ...it,
                // Normaliser createdAt en string pour la sérialisation côté client
                createdAt: (it as any).createdAt instanceof Date ? (it as any).createdAt.toISOString() : (it as any).createdAt
            })) as ItemData[]
        }
    } catch (error) {
        console.error('Erreur lors de la récupération des items:', error)
        return {
            success: false,
            error: 'Erreur lors de la récupération de vos œuvres'
        }
    }
} 