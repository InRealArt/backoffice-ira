'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { useRouter } from 'next/navigation'
import { Address, PublicClient, WalletClient } from 'viem'
import { CONTRACT_ADDRESSES, ContractName } from '@/constants/contracts'
import { getNetwork } from '@/lib/blockchain/networkConfig'
import { InRealArtRoles } from '@/lib/blockchain/smartContractConstants'
import { publicClient } from '@/lib/providers'
import { marketplaceAbi } from '@/lib/contracts/MarketplaceAbi'
import { getSmartContractAddress } from '@/app/actions/prisma/prismaActions'
import { NetworkType } from '@prisma/client'

interface ListingParams {
    nftResource: {
        id: string | number
        collection: {
            contractAddress: Address
        }
        tokenId: number
    }
    price: string // ETH amount
    duration: number // Days
    publicClient: PublicClient
    walletClient: WalletClient
    marketplaceManager: Address
    onSuccess?: () => void
    redirectAfterListing?: boolean
    redirectPath?: string
}

interface UseMarketplaceListingReturn {
    listNftOnMarketplace: (params: ListingParams) => Promise<boolean>
    checkMarketplaceRole: (userAddress: string, contractAddress: string) => Promise<boolean>
    isLoading: boolean
    isCheckingRole: boolean
    error: string | null
    success: boolean
    txHash: string | null
}

/**
 * Hook personnalisé pour gérer le listing des NFTs sur la marketplace
 */
export function useMarketplaceListing(): UseMarketplaceListingReturn {
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [isCheckingRole, setIsCheckingRole] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<boolean>(false)
    const [txHash, setTxHash] = useState<string | null>(null)
    const router = useRouter()

    /**
     * Vérifie si l'utilisateur a les droits pour lister sur la marketplace
     * @param userAddress - Adresse Ethereum de l'utilisateur
     * @param contractAddress - Adresse du contrat de marketplace
     * @returns Promise<boolean> - Vrai si l'utilisateur a les droits nécessaires
     */
    const checkMarketplaceRole = async (userAddress: string, contractAddress: string): Promise<boolean> => {
        if (!userAddress || !contractAddress) return false

        setIsCheckingRole(true)
        try {
            const hasMarketplaceSellerRole = await publicClient.readContract({
                address: contractAddress as Address,
                abi: marketplaceAbi,
                functionName: 'hasRole',
                args: [InRealArtRoles.SELLER_ROLE, userAddress as Address]
            }) as boolean

            const hasRole = hasMarketplaceSellerRole
            console.log(`L'utilisateur ${userAddress} ${hasRole ? 'a' : 'n\'a pas'} les droits pour lister sur la marketplace`)

            return hasRole
        } catch (error) {
            console.error('Erreur lors de la vérification des rôles:', error)
            return false
        } finally {
            setIsCheckingRole(false)
        }
    }

    /**
     * Liste un NFT sur la marketplace
     */
    const listNftOnMarketplace = async ({
        nftResource,
        price,
        duration,
        publicClient,
        walletClient,
        marketplaceManager,
        onSuccess = () => { },
        redirectAfterListing = true,
        redirectPath = '/marketplace/marketplaceListing'
    }: ListingParams): Promise<boolean> => {
        // Réinitialiser les états
        setIsLoading(true)
        setError(null)
        setSuccess(false)
        setTxHash(null)

        // Afficher un toast de chargement
        const listingToast = toast.loading('Listing du NFT sur la marketplace en cours...')
        console.log('price', price)
        // Conversion du prix en WEI (1 ETH = 10^18 WEI)
        const priceInWei = BigInt(Math.floor(parseFloat(price) * 10 ** 18))

        // Calcul de la date d'expiration (timestamp actuel + durée en jours convertie en secondes)
        const currentTimestamp = Math.floor(Date.now() / 1000) // timestamp en secondes
        const expirationTimestamp = BigInt(currentTimestamp + (duration * 24 * 60 * 60))

        try {
            const currentNetwork = getNetwork()
            const marketplaceContractAddress = await getSmartContractAddress('Marketplace', currentNetwork as NetworkType) as Address

            // Création des arguments pour le listing
            const args = [
                nftResource.collection.contractAddress, // adresse du contrat NFT
                nftResource.tokenId, // ID du token
                priceInWei // prix en WEI
            ]
            console.log('Args pour le listing marketplace:', args)

            // Simulation de la transaction
            const { request } = await publicClient.simulateContract({
                address: marketplaceContractAddress,
                abi: marketplaceAbi,
                functionName: 'listItem',
                args: args,
                account: marketplaceManager
            })

            if (!walletClient) {
                throw new Error('Wallet client non disponible')
            }

            // Exécution de la transaction
            const hash = await walletClient.writeContract(request)
            setTxHash(hash)

            toast.dismiss(listingToast)
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
                toast.success('NFT listé sur la marketplace avec succès!')

                // Appeler le callback de succès
                onSuccess()

                // Redirection si demandée
                if (redirectAfterListing) {
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
            console.error('Erreur lors du listing du NFT:', error.message)
            if (error.message.includes('User rejected the request')) {
                toast.dismiss(listingToast)
                toast.error('La transaction a été refusée par l\'utilisateur')
                setError('La transaction a été refusée par l\'utilisateur')
            } else {
                const errorMessage = error.message || 'Une erreur est survenue'
                setError(errorMessage)
                toast.dismiss(listingToast)
                toast.error(`Erreur lors du listing du NFT: ${errorMessage}`)
            }
            return false
        } finally {
            setIsLoading(false)
        }
    }

    return {
        listNftOnMarketplace,
        checkMarketplaceRole,
        isLoading,
        isCheckingRole,
        error,
        success,
        txHash
    }
} 