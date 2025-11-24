'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { getAuthenticatedUserEmail } from '@/lib/auth-helpers'
import { getBackofficeUserByEmail } from './prisma-actions'
import { getLandingArtistByArtistId } from './artist-actions'

export interface CreatePhysicalCollectionData {
    name: string
    description: string
}

export interface PhysicalCollection {
    id: number
    name: string
    description: string
    landingArtistId: number
    createdAt?: Date
    updatedAt?: Date
}

/**
 * Crée une nouvelle collection physique pour l'artiste authentifié
 */
export async function createPhysicalCollection(
    data: CreatePhysicalCollectionData
): Promise<{ success: boolean; message?: string; collection?: PhysicalCollection }> {
    try {
        // Récupérer l'email de l'utilisateur authentifié
        const userEmail = await getAuthenticatedUserEmail()

        // Récupérer l'utilisateur backoffice
        const backofficeUser = await getBackofficeUserByEmail(userEmail)

        if (!backofficeUser) {
            return {
                success: false,
                message: 'Utilisateur non trouvé'
            }
        }

        // Vérifier que l'utilisateur a un artistId
        if (!backofficeUser.artistId) {
            return {
                success: false,
                message: 'Vous devez avoir un profil artiste pour créer une collection'
            }
        }

        // Récupérer le LandingArtist associé à l'artiste
        const landingArtist = await getLandingArtistByArtistId(backofficeUser.artistId)

        if (!landingArtist) {
            return {
                success: false,
                message: 'Profil artiste landing non trouvé'
            }
        }

        // Créer la collection
        const collection = await prisma.physicalCollection.create({
            data: {
                name: data.name,
                description: data.description,
                landingArtistId: landingArtist.id
            }
        })

        // Revalider les chemins concernés
        revalidatePath('/art/collection')
        revalidatePath('/art/create-physical-collection')

        return {
            success: true,
            message: 'Collection créée avec succès',
            collection: {
                id: collection.id,
                name: collection.name,
                description: collection.description,
                landingArtistId: collection.landingArtistId,
            }
        }
    } catch (error) {
        console.error('Erreur lors de la création de la collection:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la création de la collection'
        }
    }
}

/**
 * Récupère toutes les collections physiques d'un artiste
 */
export async function getPhysicalCollectionsByArtistId(
    artistId: number
): Promise<PhysicalCollection[]> {
    try {
        // Récupérer le LandingArtist associé à l'artiste
        const landingArtist = await getLandingArtistByArtistId(artistId)

        if (!landingArtist) {
            return []
        }

        // Récupérer les collections
        const collections = await prisma.physicalCollection.findMany({
            where: {
                landingArtistId: landingArtist.id
            },
        })

        return collections.map(collection => ({
            id: collection.id,
            name: collection.name,
            description: collection.description,
            landingArtistId: collection.landingArtistId,
        }))
    } catch (error) {
        console.error('Erreur lors de la récupération des collections:', error)
        return []
    }
}

/**
 * Récupère une collection physique par son ID
 */
export async function getPhysicalCollectionById(
    id: number
): Promise<PhysicalCollection | null> {
    try {
        const collection = await prisma.physicalCollection.findUnique({
            where: { id }
        })

        if (!collection) {
            return null
        }

        return {
            id: collection.id,
            name: collection.name,
            description: collection.description,
            landingArtistId: collection.landingArtistId,
        }
    } catch (error) {
        console.error('Erreur lors de la récupération de la collection:', error)
        return null
    }
}

export interface PhysicalCollectionWithItems extends PhysicalCollection {
    physicalItems: Array<{
        id: bigint
        itemId: number
        status: 'created' | 'pending' | 'listed' | 'sold'
        isOnline: boolean
        item: {
            id: number
            name: string
            mainImageUrl: string | null
            secondaryImagesUrl: string[]
        }
    }>
}

/**
 * Récupère toutes les collections physiques avec leurs items pour l'artiste authentifié
 */
export async function getPhysicalCollectionsWithItems(): Promise<PhysicalCollectionWithItems[]> {
    try {
        // Récupérer l'email de l'utilisateur authentifié
        const userEmail = await getAuthenticatedUserEmail()

        // Récupérer l'utilisateur backoffice
        const backofficeUser = await getBackofficeUserByEmail(userEmail)

        if (!backofficeUser || !backofficeUser.artistId) {
            console.log('[getPhysicalCollectionsWithItems] Pas d\'utilisateur ou pas d\'artistId')
            return []
        }

        console.log('[getPhysicalCollectionsWithItems] ArtistId:', backofficeUser.artistId)

        // Récupérer le LandingArtist associé à l'artiste
        const landingArtist = await getLandingArtistByArtistId(backofficeUser.artistId)

        if (!landingArtist) {
            console.log('[getPhysicalCollectionsWithItems] Pas de LandingArtist trouvé pour artistId:', backofficeUser.artistId)
            return []
        }

        console.log('[getPhysicalCollectionsWithItems] LandingArtistId:', landingArtist.id)

        // Récupérer les collections avec leurs items
        // Note: PhysicalCollection est dans le schéma "backoffice", LandingArtist dans "landing"
        // Utiliser une requête directe avec le landingArtistId
        const collections = await prisma.physicalCollection.findMany({
            where: {
                landingArtistId: landingArtist.id
            },
            include: {
                landingArtist: {
                    select: {
                        id: true,
                        artistId: true
                    }
                },
                physicalItems: {
                    include: {
                        item: {
                            select: {
                                id: true,
                                name: true,
                                mainImageUrl: true,
                                secondaryImagesUrl: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            },
            orderBy: {
                id: 'desc'
            }
        })

        console.log('[getPhysicalCollectionsWithItems] Collections trouvées:', collections.length)

        // Si aucune collection n'est trouvée, vérifier s'il y en a d'autres dans la base
        if (collections.length === 0) {
            const allCollectionsCount = await prisma.physicalCollection.count()
            console.log('[getPhysicalCollectionsWithItems] Nombre total de collections dans la base:', allCollectionsCount)

            // Vérifier s'il y a des collections avec d'autres landingArtistId
            const otherCollections = await prisma.physicalCollection.findMany({
                take: 5,
                select: {
                    id: true,
                    name: true,
                    landingArtistId: true
                }
            })
            console.log('[getPhysicalCollectionsWithItems] Exemples de collections:', otherCollections)
        }

        return collections.map(collection => ({
            id: collection.id,
            name: collection.name,
            description: collection.description,
            landingArtistId: collection.landingArtistId,
            physicalItems: collection.physicalItems.map(pi => ({
                id: pi.id,
                itemId: pi.itemId,
                status: pi.status,
                isOnline: pi.isOnline,
                item: {
                    id: pi.item.id,
                    name: pi.item.name,
                    mainImageUrl: pi.item.mainImageUrl,
                    secondaryImagesUrl: pi.item.secondaryImagesUrl
                }
            }))
        }))
    } catch (error) {
        console.error('Erreur lors de la récupération des collections avec items:', error)
        return []
    }
}

