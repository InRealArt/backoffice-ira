'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

type RequestListingParams = {
    idProductShopify: string | number | bigint
    idCollectionShopify: string | number | bigint
    idUser: number
    image: string
}

type RequestListingResult = {
    success: boolean
    message: string
}

export async function requestArtworkListing(
    params: RequestListingParams
): Promise<RequestListingResult> {
    try {
        // Convertir les identifiants en string pour la recherche
        const productId = params.idProductShopify.toString()

        // Vérifier si une demande existe déjà pour ce produit
        const existingRequest = await prisma.requestArtworkToList.findFirst({
            where: {
                idProductShopify: {
                    equals: params.idProductShopify as bigint
                },
                idUser: params.idUser
            }
        })

        if (existingRequest) {
            return {
                success: false,
                message: 'Une demande existe déjà pour cette œuvre'
            }
        }

        // Créer la demande dans la base de données
        await prisma.requestArtworkToList.create({
            data: {
                idProductShopify: params.idProductShopify as bigint,
                idCollectionShopify: params.idCollectionShopify as bigint,
                idUser: params.idUser,
                image: params.image,
                status: 'pending'
            }
        })

        // Revalidation du chemin pour actualiser les données
        revalidatePath('/shopify')

        return {
            success: true,
            message: 'Demande de listing envoyée avec succès'
        }
    } catch (error) {
        console.error('Erreur lors de la demande de listing:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la demande de listing'
        }
    }
} 