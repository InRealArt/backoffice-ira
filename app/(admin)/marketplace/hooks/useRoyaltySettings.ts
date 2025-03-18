'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { artistNftCollectionAbi } from '@/lib/contracts/ArtistNftCollectionAbi'
import { Address, PublicClient, WalletClient } from 'viem'
import { CONTRACT_ADDRESSES, ContractName } from '@/constants/contracts'
import { getNetwork } from '@/lib/blockchain/networkConfig'
import { artistRoyaltiesAbi } from '@/lib/contracts/ArtistRoyaltiesAbi'
import { InRealArtSmartContractConstants, InRealArtRoles } from '@/lib/blockchain/smartContractConstants'
import { createRoyaltyBeneficiary, updateNftResourceStatusToRoyaltySet, updateNftResourceTxHash } from '@/app/actions/prisma/prismaActions'
import { publicClient } from '@/lib/providers'

interface RoyaltyParams {
    nftResource: {
        id: string | number
        collection: {
            contractAddress: Address
        }
        smartContract: {
            royaltiesAddress: Address
        }
        tokenId: number
    }
    recipients: Address[]
    percentages: number[]
    totalPercentage: number
    publicClient: PublicClient
    walletClient: WalletClient
    royaltiesManager: Address
    onSuccess?: () => void
    redirectAfterConfig?: boolean
    redirectPath?: string
}

interface UseRoyaltySettingsReturn {
    configureRoyalties: (params: RoyaltyParams) => Promise<boolean>
    checkRoyaltyRole: (userAddress: string, contractAddress: string) => Promise<boolean>
    isLoading: boolean
    isCheckingRole: boolean
    error: string | null
    success: boolean
    txHash: string | null
}

/**
 * Hook personnalisé pour gérer la configuration des royalties sur les NFTs
 */
export function useRoyaltySettings(): UseRoyaltySettingsReturn {
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [isCheckingRole, setIsCheckingRole] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<boolean>(false)
    const [txHash, setTxHash] = useState<string | null>(null)
    const router = useRouter()

    /**
     * Vérifie si l'utilisateur a les droits pour configurer les royalties
     * @param userAddress - Adresse Ethereum de l'utilisateur
     * @param contractAddress - Adresse du contrat de royalties
     * @returns Promise<boolean> - Vrai si l'utilisateur a les droits nécessaires
     */
    const checkRoyaltyRole = async (userAddress: string, contractAddress: string): Promise<boolean> => {
        if (!userAddress || !contractAddress) return false

        setIsCheckingRole(true)
        try {
            const hasAdminRole = await publicClient.readContract({
                address: contractAddress as Address,
                abi: artistRoyaltiesAbi,
                functionName: 'hasRole',
                args: [InRealArtRoles.DEFAULT_ADMIN_ROLE, userAddress as Address]
            }) as boolean

            const hasRoyaltiesRole = await publicClient.readContract({
                address: contractAddress as Address,
                abi: artistRoyaltiesAbi,
                functionName: 'hasRole',
                args: [InRealArtRoles.ADMIN_ROYALTIES_ROLE, userAddress as Address]
            }) as boolean

            const hasRole = hasAdminRole || hasRoyaltiesRole
            console.log(`L'utilisateur ${userAddress} ${hasRole ? 'a' : 'n\'a pas'} les droits pour configurer les royalties`)

            return hasRole
        } catch (error) {
            console.error('Erreur lors de la vérification des rôles:', error)
            return false
        } finally {
            setIsCheckingRole(false)
        }
    }

    /**
     * Configure les royalties pour un NFT spécifique
     */
    const configureRoyalties = async ({
        nftResource,
        recipients,
        percentages,
        totalPercentage,
        publicClient,
        walletClient,
        royaltiesManager,
        onSuccess = () => { },
        redirectAfterConfig = true,
        redirectPath = '/marketplace/royaltiesSettings'
    }: RoyaltyParams): Promise<boolean> => {
        // Réinitialiser les états
        setIsLoading(true)
        setError(null)
        setSuccess(false)
        setTxHash(null)

        // Afficher un toast de chargement
        const configToast = toast.loading('Configuration des royalties en cours...')

        const args = [
            nftResource.collection.contractAddress,
            nftResource.tokenId,
            recipients,
            percentages.map(p => Math.round(p) * InRealArtSmartContractConstants.PERCENTAGE_PRECISION),
            Math.round(totalPercentage * InRealArtSmartContractConstants.PERCENTAGE_PRECISION)
        ]
        console.log('args:', args)
        console.log('nftResource.smartContract.royaltiesAddress:', nftResource.smartContract.royaltiesAddress)
        try {
            // Simuler la transaction
            const { request } = await publicClient.simulateContract({
                address: nftResource.smartContract.royaltiesAddress,
                abi: artistRoyaltiesAbi,
                functionName: 'setRoyalty',
                args: args,
                account: royaltiesManager as Address
            })

            if (!walletClient) {
                throw new Error('Wallet client non disponible')
            }

            // Exécuter la transaction
            const hash = await walletClient.writeContract(request)
            setTxHash(hash)

            await updateNftResourceTransactionHash(hash, nftResource)

            toast.dismiss(configToast)
            const waitingBlockchainConfirmationToast = toast.loading(
                `Transaction soumise en attente de confirmation dans la blockchain. Hash: ${hash.slice(0, 10)}...`
            )

            // Attendre la confirmation de la transaction
            const receipt = await publicClient.waitForTransactionReceipt({
                hash
            })

            // Vérifier si la transaction est réussie
            if (receipt.status === 'success') {
                toast.dismiss(waitingBlockchainConfirmationToast)
                setSuccess(true)
                toast.success('Royalties configurées avec succès!')
                //Update Status to ROYALTYSET
                await updateNftResourceStatus(nftResource)
                // Créer les beneficiaires
                await createRoyaltyArray(nftResource, recipients, percentages, totalPercentage)
                // Appeler le callback de succès
                onSuccess()

                // Redirection si demandée
                if (redirectAfterConfig) {
                    setTimeout(() => {
                        router.push(redirectPath)
                    }, 1500)
                }

                return true
            } else {
                toast.dismiss(waitingBlockchainConfirmationToast)
                toast.error('La confirmation de la transaction dans la Blockchain a échoué')
                throw new Error('La transaction a échoué')
            }

        } catch (error: any) {
            console.error('Erreur lors de la configuration des royalties:', error.message)
            if (error.message.includes('User rejected the request')) {
                toast.dismiss(configToast)
                toast.error('La transaction a été refusée par l\'utilisateur')
                setError('La transaction a été refusée par l\'utilisateur')
            } else {
                const errorMessage = error.message || 'Une erreur est survenue'
                setError(errorMessage)
                toast.dismiss(configToast)
                toast.error(`Erreur lors de la configuration des royalties: ${errorMessage}`)
            }
            return false
        } finally {
            setIsLoading(false)
        }
    }

    const updateNftResourceTransactionHash = async (hash: string, nftResource: { id: string | number }) => {
            try {
                // Mettre à jour le txHash dans la base de données
                const updateResult = await updateNftResourceTxHash(Number(nftResource.id), hash)

                if (updateResult.success) {
                    toast.success('NFT minté en attente de confirmation...')
                } else {
                    toast.error(`Erreur lors de la mise à jour du txHash: ${updateResult.error}`)
                }
            } catch (updateError) {
                console.error('Erreur lors de la mise à jour du txHash:', updateError)
                toast.error('NFT minté, mais erreur lors de la mise à jour des informations')
            }

    }

    const updateNftResourceStatus = async (nftResource: { id: string | number }) => {
        try {
            // Mettre à jour le txHash dans la base de données
            const updateResult = await updateNftResourceStatusToRoyaltySet(Number(nftResource.id))

            if (updateResult.success) {
                toast.success('NFT minté en attente de confirmation...')
            } else {
                toast.error(`Erreur lors de la mise à jour du txHash: ${updateResult.error}`)
            }
        } catch (updateError) {
            console.error('Erreur lors de la mise à jour du txHash:', updateError)
            toast.error('NFT minté, mais erreur lors de la mise à jour des informations')
        }
    }

    const createRoyaltyArray = async (nftResource: { id: string | number }, recipients: Address[], percentages: number[], totalPercentage: number) => {
        let i = 0
        for (const recipient of recipients) {
            try {
                const createdRoyalty = await createRoyaltyBeneficiary(Number(nftResource.id), recipient, percentages[i], totalPercentage)
            } catch (updateError) {
                console.error('Erreur lors de la création du beneficiaire:', updateError)
                toast.error('NFT minté, mais erreur lors de la création du beneficiaire')
                break
            }
            i++
        }
    }

return {
        configureRoyalties,
        checkRoyaltyRole,
        isLoading,
        isCheckingRole,
        error,
        success,
        txHash
    }
} 