'use server'

import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { NetworkType } from '@prisma/client'

const smartContractSchema = z.object({
    factoryAddress: z.string()
        .min(1, 'L\'adresse du contrat factory est requise')
        .regex(/^0x[a-fA-F0-9]{40}$/, 'Adresse Ethereum invalide'),
    royaltiesAddress: z.string()
        .min(1, 'L\'adresse du contrat de royalties est requise')
        .regex(/^0x[a-fA-F0-9]{40}$/, 'Adresse Ethereum invalide'),
    marketplaceAddress: z.string()
        .min(1, 'L\'adresse du contrat marketplace est requise')
        .regex(/^0x[a-fA-F0-9]{40}$/, 'Adresse Ethereum invalide'),
    network: z.enum(['mainnet', 'sepolia', 'polygon', 'polygonAmoy', 'arbitrum', 'base', 'sepoliaBase'], {
        required_error: 'Veuillez sélectionner un réseau',
    }),
    active: z.boolean().default(true)
})

type CreateSmartContractInput = z.infer<typeof smartContractSchema>

export async function createSmartContracts(data: CreateSmartContractInput) {
    try {
        // Valider les données
        const validationResult = smartContractSchema.safeParse(data)

        if (!validationResult.success) {
            return {
                success: false,
                message: 'Données invalides',
                errors: validationResult.error.format()
            }
        }

        const { factoryAddress, royaltiesAddress, marketplaceAddress, network, active } = validationResult.data

        // Vérifier si une configuration avec ces adresses existe déjà sur ce réseau
        const existingSmartContract = await prisma.smartContract.findFirst({
            where: {
                AND: [
                    { network },
                    {
                        OR: [
                            { factoryAddress },
                            { royaltiesAddress },
                            { marketplaceAddress }
                        ]
                    }
                ]
            }
        })

        if (existingSmartContract) {
            return {
                success: false,
                message: 'Un smart contract avec une de ces adresses existe déjà sur ce réseau'
            }
        }

        // Créer le nouveau smart contract
        const smartContract = await prisma.smartContract.create({
            data: {
                factoryAddress,
                royaltiesAddress,
                marketplaceAddress,
                network,
                active
            }
        })

        return {
            success: true,
            smartContract
        }
    } catch (error) {
        console.error('Erreur lors de la création du smart contract:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la création du smart contract'
        }
    }
}

export async function updateSmartContract(id: number, data: CreateSmartContractInput) {
    try {
        const validationResult = smartContractSchema.safeParse(data)

        if (!validationResult.success) {
            return {
                success: false,
                message: 'Données invalides',
                errors: validationResult.error.format()
            }
        }

        const { factoryAddress, royaltiesAddress, marketplaceAddress, network, active } = validationResult.data

        // Vérifier si un autre smart contract utilise déjà ces adresses
        const existingSmartContract = await prisma.smartContract.findFirst({
            where: {
                AND: [
                    { network },
                    {
                        OR: [
                            { factoryAddress },
                            { royaltiesAddress },
                            { marketplaceAddress }
                        ]
                    },
                    { NOT: { id } } // Exclure le smart contract en cours d'édition
                ]
            }
        })

        if (existingSmartContract) {
            return {
                success: false,
                message: 'Un smart contract avec une de ces adresses existe déjà sur ce réseau'
            }
        }

        const updatedSmartContract = await prisma.smartContract.update({
            where: { id },
            data: {
                factoryAddress,
                royaltiesAddress,
                marketplaceAddress,
                network,
                active
            }
        })

        return {
            success: true,
            smartContract: updatedSmartContract
        }
    } catch (error) {
        console.error('Erreur lors de la mise à jour du smart contract:', error)
        return {
            success: false,
            message: 'Une erreur est survenue lors de la mise à jour du smart contract'
        }
    }
} 