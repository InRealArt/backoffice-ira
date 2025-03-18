'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { artistNftCollectionAbi } from '@/lib/contracts/ArtistNftCollectionAbi'
import { Address, PublicClient, WalletClient } from 'viem'
import { CONTRACT_ADDRESSES, ContractName } from '@/constants/contracts'
import { getNetwork } from '@/lib/blockchain/networkConfig'
import { artistRoyaltiesAbi } from '@/lib/contracts/ArtistRoyaltiesAbi'
import { InRealArtSmartContractConstants } from '@/lib/blockchain/smartContractConstants'
import { updateNftResourceTxHash } from '@/app/actions/prisma/prismaActions'
interface RoyaltyParams {
    nftResource: {
        id: string | number
        collection: {
            contractAddress: Address
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
    isLoading: boolean
    error: string | null
    success: boolean
    txHash: string | null
}

/**
 * Hook personnalisé pour gérer la configuration des royalties sur les NFTs
 */
export function useRoyaltySettings(): UseRoyaltySettingsReturn {
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<boolean>(false)
    const [txHash, setTxHash] = useState<string | null>(null)
    const router = useRouter()

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
            percentages.map(p => Math.round(p) *InRealArtSmartContractConstants.PERCENTAGE_PRECISION),
            Math.round(totalPercentage * InRealArtSmartContractConstants.PERCENTAGE_PRECISION)
          ]
        console.log('args:', args)
        try {
            const network = getNetwork()
            const royaltiesContractAddress = CONTRACT_ADDRESSES[network.id][ContractName.NFT_ROYALTIES] as Address
            // Simuler la transaction
            const { request } = await publicClient.simulateContract({
                address: royaltiesContractAddress,
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

    return {
        configureRoyalties,
        isLoading,
        error,
        success,
        txHash
    }
} 