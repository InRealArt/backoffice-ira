'use server'

import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { Chain } from '@prisma/client'

const factorySchema = z.object({
    contractAddress: z.string()
        .min(1, 'L\'adresse du contrat est requise')
        .regex(/^0x[a-fA-F0-9]{40}$/, 'Adresse Ethereum invalide'),
    chain: z.enum(['eth_mainnet', 'sepolia', 'polygon_mainnet', 'polygon_testnet'], {
        required_error: 'Veuillez sélectionner un réseau',
    }),
})

type CreateFactoryInput = z.infer<typeof factorySchema>

export async function createFactory(data: CreateFactoryInput) {
    try {
        // Valider les données
        const validationResult = factorySchema.safeParse(data)

        if (!validationResult.success) {
            return {
                success: false,
                message: 'Données invalides',
                errors: validationResult.error.format()
            }
        }

        const { contractAddress, chain } = validationResult.data

        // Vérifier si une factory avec cette adresse existe déjà
        const existingFactory = await prisma.factory.findFirst({
            where: {
                contractAddress,
                chain,
            },
        })

        if (existingFactory) {
            return {
                success: false,
                message: 'Une factory avec cette adresse existe déjà sur ce réseau'
            }
        }

        // Créer la nouvelle factory
        const factory = await prisma.factory.create({
            data: {
                contractAddress,
                chain: chain as Chain,
            },
        })

        return {
            success: true,
            factory
        }
    } catch (error) {
        console.error('Erreur lors de la création de la factory:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la création de la factory'
        }
    }
} 