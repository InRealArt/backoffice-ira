'use server'

import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { publicClient } from '@/lib/providers'
import { factoryABI } from '@/lib/contracts/factoryABI'
import { Address, decodeEventLog } from 'viem'
import { CollectionStatus } from '@prisma/client'
import { Prisma } from '@prisma/client'
import { redirect } from 'next/navigation'

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

export async function createCollection(data: {
    name: string
    symbol: string
    addressAdmin: string
    artistId: number
    factoryId: number
    contractAddress: string | 'pending'
    transactionHash?: string
    status?: 'pending' | 'confirmed' | 'failed'
}): Promise<{ success: boolean; message?: string }> {
    try {
        const collection = await prisma.collection.create({
            data: {
                name: data.name,
                symbol: data.symbol,
                addressAdmin: data.addressAdmin,
                artistId: data.artistId,
                factoryId: data.factoryId,
                contractAddress: data.contractAddress,
                transactionHash: data.transactionHash,
                status: data.status || 'pending'
            }
        })

        return { success: true }
    } catch (error) {
        console.error("Erreur lors de la création de la collection:", error)
        return {
            success: false,
            message: `Erreur lors de la création: ${(error as Error).message}`
        }
    }
}

// Synchroniser toutes les collections en attente
export async function syncPendingCollections(): Promise<{
    success: boolean;
    updated?: number;
    message?: string
}> {
    try {
        // Utiliser SQL brut pour éviter les problèmes avec l'enum
        const pendingCollections = await prisma.$queryRaw`
            SELECT * FROM public."Collection" 
            WHERE status = 'pending' 
            AND "transactionHash" IS NOT NULL
        `;

        if (!pendingCollections || (pendingCollections as any[]).length === 0) {
            return { success: true, updated: 0, message: 'Aucune collection en attente' }
        }

        let updatedCount = 0

        // Vérifier chaque collection
        for (const collection of pendingCollections as any[]) {
            if (!collection.transactionHash) continue

            try {
                // Vérifier le statut de la transaction
                const receipt = await publicClient.getTransactionReceipt({
                    hash: collection.transactionHash as Address
                })

                if (receipt && receipt.status === 'success') {
                    // Transaction confirmée, chercher l'adresse du contrat
                    let contractAddress: string | undefined

                    // Parcourir les logs pour l'événement ArtistCreated
                    for (const log of receipt.logs) {
                        try {
                            const event = decodeEventLog({
                                abi: factoryABI,
                                data: log.data,
                                topics: log.topics,
                                eventName: 'ArtistCreated'
                            })

                            if (event && event.args) {
                                const args = event.args as any
                                contractAddress = args._collectionAddress
                                break
                            }
                        } catch (e) {
                            continue
                        }
                    }

                    if (contractAddress) {
                        // Mettre à jour la collection avec SQL brut
                        await prisma.$executeRaw`
                            UPDATE public."Collection"
                            SET "contractAddress" = ${contractAddress}, 
                                status = 'confirmed'
                            WHERE id = ${collection.id}
                        `;

                        updatedCount++
                    }
                } else if (receipt && receipt.status === 'reverted') {
                    // Transaction échouée - utiliser SQL brut
                    await prisma.$executeRaw`
                        UPDATE public."Collection"
                        SET status = 'failed'
                        WHERE id = ${collection.id}
                    `;

                    updatedCount++
                }
                // Si la transaction est encore en attente, ne rien faire
            } catch (error) {
                console.warn(`Erreur lors de la vérification de la collection ${collection.id}:`, error)
                // Continuer avec les autres collections
            }
        }

        const result = {
            success: true,
            updated: updatedCount,
            message: `${updatedCount} collection(s) mise(s) à jour`
        }

        // Redirection vers la page des collections
        redirect('/blockchain/collections')

        // Ce code ne sera jamais exécuté à cause du redirect, mais TypeScript
        // exige un retour pour respecter le type de retour de la fonction
        return result
    } catch (error) {
        console.error('Erreur lors de la synchronisation des collections:', error)
        return {
            success: false,
            message: `Erreur: ${(error as Error).message}`
        }
    }
} 