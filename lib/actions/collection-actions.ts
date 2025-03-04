'use server'

import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const collectionSchema = z.object({
    name: z.string().min(1, 'Le nom de la collection est requis'),
    symbol: z.string().min(1, 'Le symbole est requis')
        .max(10, 'Le symbole ne doit pas dépasser 10 caractères')
        .regex(/^[A-Z0-9]+$/, 'Le symbole doit être en majuscules et sans espaces'),
    addressAdmin: z.string()
        .min(1, 'L\'adresse admin est requise')
        .regex(/^0x[a-fA-F0-9]{40}$/, 'Adresse Ethereum invalide'),
    artistId: z.number().int().positive('ID artiste invalide'),
    factoryId: z.number().int().positive('ID factory invalide'),
    contractAddress: z.string()
        .min(1, 'L\'adresse du contrat est requise')
        .regex(/^0x[a-fA-F0-9]{40}$/, 'Adresse Ethereum invalide'),
})

type CreateCollectionInput = z.infer<typeof collectionSchema>

export async function createCollection(data: CreateCollectionInput) {
    try {
        // Valider les données
        const validationResult = collectionSchema.safeParse(data)

        if (!validationResult.success) {
            return {
                success: false,
                message: 'Données invalides',
                errors: validationResult.error.format()
            }
        }

        const { name, symbol, contractAddress, artistId, addressAdmin, factoryId } = validationResult.data

        // Vérifier si l'artiste existe
        const artist = await prisma.artist.findUnique({
            where: { id: artistId }
        })

        if (!artist) {
            return {
                success: false,
                message: 'Artiste introuvable'
            }
        }

        // Vérifier si la factory existe
        const factory = await prisma.factory.findUnique({
            where: { id: factoryId }
        })

        if (!factory) {
            return {
                success: false,
                message: 'Factory introuvable'
            }
        }

        // Vérifier si une collection avec ce symbole ou cette adresse existe déjà
        const existingCollection = await prisma.collection.findFirst({
            where: {
                OR: [
                    { symbol },
                    { contractAddress }
                ]
            }
        })

        if (existingCollection) {
            const field = existingCollection.symbol === symbol ? 'symbole' : 'adresse de contrat'
            return {
                success: false,
                message: `Une collection avec ce ${field} existe déjà`
            }
        }

        // Créer la nouvelle collection
        const collection = await prisma.collection.create({
            data: {
                name,
                symbol,
                contractAddress,
                artistId,
                addressAdmin,
                factoryId,
            },
        })

        return {
            success: true,
            collection
        }
    } catch (error) {
        console.error('Erreur lors de la création de la collection:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la création de la collection'
        }
    }
} 