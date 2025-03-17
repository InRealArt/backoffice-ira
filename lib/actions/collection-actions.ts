'use server'

import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { serverPublicClient } from '@/lib/server-providers'
import { factoryABI } from '@/lib/contracts/factoryABI'
import { Address, decodeEventLog } from 'viem'
import { CollectionStatus, NftCollection } from '@prisma/client'
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
    smartContractId: z.number().int().positive('ID smart contract invalide'),
    contractAddress: z.string()
        .min(1, 'L\'adresse du contrat est requise')
        .regex(/^0x[a-fA-F0-9]{40}$/, 'Adresse Ethereum invalide'),
})

type CreateCollectionInput = z.infer<typeof collectionSchema>

export async function createCollection(data: Partial<NftCollection>) : Promise<{
    success: boolean,
    message: string,
    errorCode: string | null,
    collection: NftCollection | null
}> {
    try {
      const collection = await prisma.nftCollection.create({
        data: {
          name: data.name!,
          symbol: data.symbol!,
          addressAdmin: data.addressAdmin!,
          artistId: data.artistId!,
          smartContractId: data.smartContractId!,
          contractAddress: data.contractAddress,
          status: data.status || CollectionStatus.pending,
          transactionHash: data.transactionHash
        }
      })
      
      return { 
        success: true, 
        message: 'Collection créée avec succès', 
        errorCode: null,
        collection 
      }
    } catch (error) {
      // Vérifier si l'erreur est une erreur Prisma
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // P2002 est le code pour les violations de contraintes d'unicité
        if (error.code === 'P2002') {
          // Récupérer les champs concernés par la contrainte
          const target = error.meta?.target as string[] || []
          
          if (target.includes('symbol') && target.includes('smartContractId')) {
            return {
              success: false,
              message: `Une collection avec ce symbole existe déjà pour ce smart contract`,
              errorCode: 'DUPLICATE_SYMBOL_CONTRACT',
              collection: null
            }
          } else if (target.includes('symbol')) {
            return {
              success: false,
              message: `Le symbole "${data.symbol}" est déjà utilisé`,
              errorCode: 'DUPLICATE_SYMBOL',
              collection: null
            }
          } else {
            return {
              success: false,
              message: `Violation de contrainte d'unicité sur: ${target.join(', ')}`,
              errorCode: 'UNIQUE_CONSTRAINT_VIOLATION',
              collection: null
            }
          }
        }
        
        // Autres codes d'erreur Prisma
        if (error.code === 'P2003') {
          return {
            success: false,
            message: 'Violation de contrainte de clé étrangère',
            errorCode: 'FOREIGN_KEY_VIOLATION',
            collection: null
          }
        }
        
        if (error.code === 'P2025') {
          return {
            success: false,
            message: 'Enregistrement à modifier non trouvé',
            errorCode: 'RECORD_NOT_FOUND',
            collection: null
          }
        }
      }
      
      // Pour les autres types d'erreurs
      console.error("Erreur lors de la création de la collection:", error)
      return {
        success: false,
        message: `Erreur lors de la création: ${(error as Error).message}`,
        errorCode: 'UNKNOWN_ERROR',
        collection: null
      }
    }
  }

  
// Synchroniser une collection spécifique avec la blockchain
export async function syncCollection(id: number): Promise<{
    success: boolean;
    updated: boolean;
    contractAddress?: string;
    message?: string;
}> {
    try {
        // Récupérer la collection
        const collection = await prisma.nftCollection.findUnique({
            where: { id }
        });

        if (!collection) {
            return {
                success: false,
                updated: false,
                message: 'Collection introuvable'
            };
        }

        if (collection.status !== 'pending' || !collection.transactionHash) {
            return {
                success: true,
                updated: false,
                message: 'La collection n\'est pas en attente de synchronisation'
            };
        }

        // Vérifier le statut de la transaction
        const receipt = await serverPublicClient.getTransactionReceipt({
            hash: collection.transactionHash as `0x${string}`
        });

        if (!receipt) {
            return {
                success: true,
                updated: false,
                message: 'Transaction toujours en attente de confirmation'
            };
        }

        if (receipt.status === 'success') {
            // Transaction confirmée, chercher l'adresse du contrat
            let contractAddress: string | undefined;

            // Parcourir les logs pour l'événement ArtistCreated
            console.log('receipt', receipt.logs)
            for (const log of receipt.logs) {
                
                try {
                    const event = decodeEventLog({
                        abi: factoryABI,
                        data: log.data,
                        topics: log.topics,
                        eventName: 'ArtistCreated'
                    });
                    if (event.eventName === 'ArtistCreated') {
                        const args = event.args as any;
                        contractAddress = args._collectionAddress;
                        break;
                    }
                } catch (e) {
                    continue;
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

            return {
                    success: true,
                    updated: true,
                    contractAddress,
                    message: 'Collection synchronisée avec succès'
                };
            } else {
                return {
                    success: false,
                    updated: false,
                    message: 'Impossible de trouver l\'adresse du contrat dans les logs de la transaction'
                };
            }
        } else if (receipt.status === 'reverted') {
            // Transaction échouée
            await prisma.$executeRaw`
        UPDATE public."Collection"
        SET status = 'failed'
        WHERE id = ${collection.id}
      `;

            return {
                success: true,
                updated: true,
                message: 'La transaction a échoué, statut mis à jour'
            };
        }

        return {
            success: true,
            updated: false,
            message: 'Aucune mise à jour nécessaire'
        };
    } catch (error) {
        console.error('Erreur lors de la synchronisation de la collection:', error);
        return {
            success: false,
            updated: false,
            message: `Erreur: ${(error as Error).message}`
        };
    }
}

// Mettre à jour l'adresse du contrat et le statut d'une collection
export async function updateCollection(idcollection: number, data: Partial<NftCollection>): Promise<{ success: boolean; message?: string }> {
    try {
        console.log('Mise à jour de la collection:', data)

        const existingCollection = await prisma.nftCollection.findUnique({
            where: { id: idcollection }
        })
     
        if (!existingCollection) {
            return {
                success: false,
                message: `Collection avec ID ${idcollection} introuvable`
            }
        }
        
        // Solution 1: Utiliser l'API Prisma directement pour éviter les problèmes de type
        await prisma.$transaction(async (tx) => {
            // 1. D'abord, mettre à jour l'adresse du contrat (sans toucher au statut)
            await tx.nftCollection.update({
                where: { id: idcollection },
                data: data
            })

            // 2. Ensuite, utiliser SQL brut seulement pour le statut
            if (data.status === 'pending') {
                await tx.$executeRaw`UPDATE public."Collection" SET status = 'pending' WHERE id = ${data.id}`;
            } else if (data.status === 'confirmed') {
                await tx.$executeRaw`UPDATE public."Collection" SET status = 'confirmed' WHERE id = ${data.id}`;
            } else if (data.status === 'failed') {
                await tx.$executeRaw`UPDATE public."Collection" SET status = 'failed' WHERE id = ${data.id}`;
            }
        })

        return { success: true }
    } catch (error) {
        console.error("Erreur lors de la mise à jour de la collection:", error)
        return {
            success: false,
            message: `Erreur lors de la mise à jour: ${(error as Error).message}`
        }
    }
} 