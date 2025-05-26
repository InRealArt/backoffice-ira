'use client'

import { useState } from 'react'
import { useToast } from '@/app/components/Toast/ToastContext'
import { useRouter } from 'next/navigation'
import { artistNftCollectionAbi } from '@/lib/contracts/ArtistNftCollectionAbi'
import {
    updateNftResourceTxHash,
    updateNftResourceStatusToMinted,
    updateNftResourceTokenId
} from '@/lib/actions/prisma-actions'
import { Address, Hash, PublicClient, WalletClient } from 'viem'

// Type pour les paramètres de la fonction mintNFT
interface MintNFTParams {
    nftResource: {
        id: string | number;
        name: string;
        description: string;
        certificateUri: string;
        tokenUri: string;
        collection: {
            contractAddress: Address;
        };
    };
    publicClient: any;
    walletClient: any;
    minterWallet: Address;
    onSuccess?: () => void;
    redirectAfterMint?: boolean;
}

// Type pour le résultat de la fonction mintNFT
interface MintNFTResult {
    success: boolean;
    receipt?: any;
    hash?: Hash;
    error?: string;
}

// Type pour les valeurs de retour du hook
interface UseNftMintingReturn {
    mintNFT: (params: MintNFTParams) => Promise<MintNFTResult>;
    isLoading: boolean;
    error: string | null;
    success: boolean;
    txHash: Hash | null;
}

/**
 * Hook personnalisé pour gérer le processus de minting de NFT
 */
export function useNftMinting(): UseNftMintingReturn {
    const [isLoading, setIsLoading] = useState<boolean>(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<boolean>(false)
    const [txHash, setTxHash] = useState<Hash | null>(null)
    const router = useRouter()
    const { success: successToast, error: errorToast, info: infoToast, dismiss: dismissToast } = useToast()
    /**
     * Fonction pour minter un NFT
     * @param {MintNFTParams} params - Paramètres pour le minting
     * @returns {Promise<MintNFTResult>} - Résultat de l'opération de minting
     */
    const mintNFT = async ({
        nftResource,
        publicClient,
        walletClient,
        minterWallet,
        onSuccess = () => { },
        redirectAfterMint = true
    }: MintNFTParams): Promise<MintNFTResult> => {
        // Réinitialiser les états
        setIsLoading(true)
        setError(null)
        setSuccess(false)
        setTxHash(null)

        const contractAddress = nftResource.collection.contractAddress

        // Afficher un toast de chargement
        const mintingToast = infoToast('Minting en cours...')

        try {
            // Préparer les paramètres NFT pour le smart contract
            const nftParams = {
                name: nftResource.name,
                description: nftResource.description,
                certificateAuthenticity: `ipfs://${nftResource.certificateUri}`,
                tags: [] as string[],
                permissions: [] as string[],
                height: 0,
                width: 0,
                withIntellectualProperty: false,
                termIntellectualProperty: 0
            }

            // URI du token (métadonnées IPFS)
            const tokenURI = `ipfs://${nftResource.tokenUri}`

            // Simuler la transaction
            const { request } = await publicClient.simulateContract({
                address: contractAddress,
                abi: artistNftCollectionAbi,
                functionName: 'mintNFT',
                args: [tokenURI, nftParams],
                account: minterWallet
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
                    successToast('NFT minté en attente de confirmation...')
                } else {
                    errorToast(`Erreur lors de la mise à jour du txHash: ${updateResult.error}`)
                }
            } catch (updateError) {
                console.error('Erreur lors de la mise à jour du txHash:', updateError)
                errorToast('NFT minté, mais erreur lors de la mise à jour des informations')
            }

            dismissToast(mintingToast as any)
            const waitingBlockchainconfirmationToast = infoToast(`Transaction soumise en attente de confirmation dans la blockchain. Hash: ${hash.slice(0, 10)}...`)

            // Attendre la confirmation de la transaction
            const receipt = await publicClient.waitForTransactionReceipt({
                hash,
                timeout: 120000
            })

            // Vérifier si la transaction est réussie
            if (receipt.status === 'success') {
                dismissToast(waitingBlockchainconfirmationToast as any)
                setSuccess(true)
                successToast('NFT minté avec succès!')

                // Mettre à jour le statut de la ressource NFT
                await updateNftResourceStatusToMinted(Number(nftResource.id))

                // Mettre à jour le tokenId, le minter et l'owner dans la base de données
                await updateNftResourceTokenId(
                    Number(nftResource.id),
                    hash,
                    minterWallet,
                    contractAddress
                )

                // Appeler le callback de succès
                onSuccess()

                // Redirection vers la liste des productListings si demandé
                if (redirectAfterMint) {
                    setTimeout(() => {
                        router.push('/marketplace/nftsToMint')
                    }, 1500) // Délai court pour permettre à l'utilisateur de voir le message de succès
                }

                return { success: true, receipt, hash }
            } else {
                dismissToast(waitingBlockchainconfirmationToast as any)
                errorToast('La confirmation de la transaction dans la Blockchain a échoué')
                throw new Error('La transaction a échoué')
            }

        } catch (error: any) {
            console.error('Erreur lors du minting:', error.message)
            if (error.message.includes('User rejected the request')) {
                dismissToast(mintingToast as any)
                errorToast('La transaction a été refusée par l\'utilisateur')
                return { success: false, error: 'La transaction a été refusée par l\'utilisateur' }
            } else {
                const errorMessage = error.message || 'Une erreur est survenue'
                setError(errorMessage)
                dismissToast(mintingToast as any)
                errorToast(`Erreur lors du minting: ${errorMessage}`)
                return { success: false, error: errorMessage }
            }
        } finally {
            setIsLoading(false)
        }
    }

    return {
        mintNFT,
        isLoading,
        error,
        success,
        txHash
    }
}