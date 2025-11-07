'use client'

import { useState } from 'react'
import { useToast } from '@/app/components/Toast/ToastContext'
import { useRouter } from 'next/navigation'
import { Address, PublicClient, WalletClient, encodeFunctionData } from 'viem'
import { CONTRACT_ADDRESSES, ContractName } from '@/constants/contracts'
import { getNetwork } from '@/lib/blockchain/networkConfig'
import { InRealArtRoles } from '@/lib/blockchain/smartContractConstants'
import { publicClient } from '@/lib/providers'
import { marketplaceAbi } from '@/lib/contracts/MarketplaceAbi'
import { getSmartContractAddress, updateNftResourceStatusToListed, updateNftResourceStatusToMinted, createMarketPlaceTransaction, updateNftResourceOwner } from '@/lib/actions/prisma-actions'
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
    publicClient: PublicClient
    walletClient: WalletClient
    marketplaceManager: Address
    onSuccess?: () => void
    redirectAfterListing?: boolean
    redirectPath?: string
}

interface UseMarketplaceListingReturn {
    listNftOnMarketplace: (params: ListingParams) => Promise<boolean>
    checkMarketplaceSellerRole: (userAddress: string, contractAddress: string) => Promise<boolean>
    isLoading: boolean
    isCheckingRole: boolean
    error: string | null
    success: boolean
    txHash: string | null
    approveMarketplaceForNft: (params: {
        collectionAddress: Address;
        tokenId: string | number;
        marketplaceAddress: Address;
        walletClient: any;
        onSuccess?: () => void;
    }) => Promise<{ success: boolean; hash: string }>
    transferNftToAdminMarketplace: (params: {
        collectionAddress: Address;
        tokenId: string | number;
        adminMarketplace: Address;
        walletClient: any;
        onSuccess?: () => void;
    }) => Promise<{ success: boolean; hash: string }>
    isApproving: boolean
    isTransferring: boolean
    approvalError: string | null
    transferError: string | null
    approvalSuccess: boolean
    transferSuccess: boolean
    canPerformAction: {
        transfer: (params: {
            isUserCollectionAdmin: boolean,
            isWalletRabby: boolean,
            isNftOwnedByAdmin: boolean
        }) => boolean
        list: (params: {
            hasMarketplaceRole: boolean,
            isNftOwnedByAdmin: boolean,
            isMarketplaceOwner: boolean
        }) => boolean
    }
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
    const [isApproving, setIsApproving] = useState(false)
    const [isTransferring, setIsTransferring] = useState(false)
    const [approvalError, setApprovalError] = useState<string | null>(null)
    const [transferError, setTransferError] = useState<string | null>(null)
    const [approvalSuccess, setApprovalSuccess] = useState(false)
    const [transferSuccess, setTransferSuccess] = useState(false)
    const router = useRouter()
    const { success: successToast, error: errorToast, info: infoToast, dismiss: dismissToast } = useToast()
    /**
     * Vérifie si l'utilisateur a les droits pour lister sur la marketplace
     * @param userAddress - Adresse Ethereum de l'utilisateur
     * @param contractAddress - Adresse du contrat de marketplace
     * @returns Promise<boolean> - Vrai si l'utilisateur a les droits nécessaires
     */
    const checkMarketplaceSellerRole = async (userAddress: string, contractAddress: string): Promise<boolean> => {
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

        // Vérification explicite de walletClient et walletClient.account
        console.log("walletClient :", walletClient)
        console.log("marketplaceManager :", marketplaceManager)
        console.log("nftResource :", nftResource)

        if (!walletClient || !walletClient.account) {
            setError('Wallet client non disponible ou non connecté')
            errorToast('Portefeuille non connecté. Veuillez vous connecter avec Rabby.')
            setIsLoading(false)
            return false
        }

        // Afficher un toast de chargement
        const listingToastId = infoToast('Listing du NFT sur la marketplace en cours...')

        try {
            const currentNetwork = getNetwork()
            const marketplaceContractAddress = await getSmartContractAddress('Marketplace', currentNetwork as NetworkType) as Address

            if (!marketplaceContractAddress) {
                throw new Error('Adresse du contrat Marketplace non disponible')
            }

            // Création des arguments pour le listing
            const args = [
                nftResource.collection.contractAddress, // adresse du contrat NFT
                nftResource.tokenId, // ID du token
                price // prix en WEI
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

            // Exécution de la transaction
            const hash = await walletClient.writeContract(request)
            setTxHash(hash)

            dismissToast(listingToastId as any)
            const waitingBlockchainConfirmationToastId = infoToast(
                `Transaction soumise en attente de confirmation dans la blockchain. Hash: ${hash.slice(0, 10)}...`
            )

            // Attendre la confirmation de la transaction
            const receipt = await publicClient.waitForTransactionReceipt({
                hash
            })

            // Vérifier si la transaction est réussie
            if (receipt.status === 'success') {
                dismissToast(waitingBlockchainConfirmationToastId as any)
                setSuccess(true)
                successToast('NFT listé sur la marketplace avec succès!')

                // Mettre à jour le statut de la ressource NFT
                await updateNftResourceStatusToListed(Number(nftResource.id))


                // Ajouter l'enregistrement de la transaction
                await createMarketPlaceTransaction({
                    nftResourceId: Number(nftResource.id),
                    functionName: 'listItem',
                    transactionHash: hash,
                    from: walletClient.account.address,
                    to: marketplaceContractAddress,
                    price: price,
                    contractAddress: marketplaceContractAddress
                })

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
                dismissToast(waitingBlockchainConfirmationToastId as any)
                errorToast('La confirmation de la transaction dans la Blockchain a échoué')
                throw new Error('La transaction a échoué')
            }

        } catch (error: any) {
            console.error('Erreur lors du listing du NFT:', error)
            const errorMessage = error.message || 'Une erreur est survenue'

            if (errorMessage.includes('User rejected the request')) {
                dismissToast(listingToastId as any)
                errorToast('La transaction a été refusée par l\'utilisateur')
                //setError('La transaction a été refusée par l\'utilisateur')
            } else {
                setError(errorMessage)
                dismissToast(listingToastId as any)
                errorToast(`Erreur lors du listing du NFT: ${errorMessage}`)
            }
            return false
        } finally {
            setIsLoading(false)
        }
    }

    // Fonction pour approuver la marketplace à dépenser le NFT
    const approveMarketplaceForNft = async ({
        collectionAddress,
        tokenId,
        marketplaceAddress,
        walletClient,
        onSuccess
    }: {
        collectionAddress: Address;
        tokenId: string | number;
        marketplaceAddress: Address;
        walletClient: any;
        onSuccess?: () => void;
    }) => {
        setIsApproving(true);
        setApprovalError(null);
        setApprovalSuccess(false);

        try {
            const hash = await walletClient.writeContract({
                address: collectionAddress,
                abi: [
                    {
                        inputs: [
                            { name: 'to', type: 'address' },
                            { name: 'tokenId', type: 'uint256' }
                        ],
                        name: 'approve',
                        outputs: [],
                        stateMutability: 'nonpayable',
                        type: 'function'
                    }
                ],
                functionName: 'approve',
                args: [marketplaceAddress, BigInt(tokenId)]
            });

            console.log('Transaction d\'approbation envoyée:', hash);

            // Attendre la confirmation de la transaction
            const receipt = await publicClient.waitForTransactionReceipt({ hash });
            console.log('Transaction d\'approbation confirmée:', receipt);

            setApprovalSuccess(true);
            if (onSuccess) onSuccess();

            return { success: true, hash };
        } catch (error: any) {
            console.error('Erreur lors de l\'approbation:', error);
            //setApprovalError(error.message || 'Erreur lors de l\'approbation');
            return { success: false, error };
        } finally {
            setIsApproving(false);
        }
    };

    // Fonction pour transférer le NFT à la marketplace
    const transferNftToAdminMarketplace = async ({
        collectionAddress,
        tokenId,
        adminMarketplace,
        walletClient,
        onSuccess
    }: {
        collectionAddress: Address;
        tokenId: string | number;
        adminMarketplace: Address;
        walletClient: any;
        onSuccess?: () => void;
    }) => {
        setIsTransferring(true);
        setTransferError(null);
        setTransferSuccess(false);

        console.log("adminMarketplace : ", adminMarketplace)
        console.log("collectionAddress : ", collectionAddress)
        console.log("tokenId : ", tokenId)
        console.log("walletClient : ", walletClient.account.address)
        try {
            // Préparer l'ABI pour l'appel à safeTransferFrom de l'ERC721
            const erc721ABI = [
                {
                    name: 'safeTransferFrom',
                    type: 'function',
                    stateMutability: 'nonpayable',
                    inputs: [
                        { name: 'from', type: 'address' },
                        { name: 'to', type: 'address' },
                        { name: 'tokenId', type: 'uint256' }
                    ],
                    outputs: []
                }
            ];

            // Encoder la fonction et les arguments
            const data = encodeFunctionData({
                abi: erc721ABI,
                functionName: 'safeTransferFrom',
                args: [
                    walletClient.account.address, // from: adresse du wallet connecté
                    adminMarketplace,           // to: adresse de l'admin marketplace
                    BigInt(tokenId)               // tokenId
                ]
            });

            // Préparer la transaction selon le format attendu par walletClient
            const txHash = await walletClient.sendTransaction({
                account: walletClient.account,
                to: collectionAddress,
                data,
                value: BigInt(0)
            });

            // Attendre la confirmation
            const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

            // Vérifier si la transaction est réussie
            if (receipt.status === 'success') {
                // Mettre à jour le propriétaire du NFT
                await updateNftResourceOwner(Number(tokenId), adminMarketplace);
            }
            else {
                errorToast('Erreur dans la mise à jour du owner en database')
            }

            setTransferSuccess(true);
            if (onSuccess) onSuccess();

            return { success: true, hash: txHash };
        } catch (error: any) {
            console.error('Erreur lors du transfert:', error);
            setTransferError(error.message || 'Erreur lors du transfert');
            return { success: false, error };
        } finally {
            setIsTransferring(false);
        }
    };

    const canPerformAction = {
        // Vérifie si l'utilisateur peut transférer le NFT
        transfer: (params: {
            isUserCollectionAdmin: boolean,
            isWalletRabby: boolean,
            isNftOwnedByAdmin: boolean
        }) => {
            const { isUserCollectionAdmin, isWalletRabby, isNftOwnedByAdmin } = params;
            return isUserCollectionAdmin && isWalletRabby && isNftOwnedByAdmin;
        },

        // Vérifie si l'utilisateur peut lister le NFT
        list: (params: {
            hasMarketplaceRole: boolean,
            isNftOwnedByAdmin: boolean,
            isMarketplaceOwner: boolean
        }) => {
            const { hasMarketplaceRole, isNftOwnedByAdmin, isMarketplaceOwner } = params;
            return hasMarketplaceRole && (isMarketplaceOwner || !isNftOwnedByAdmin);
        }
    };

    return {
        listNftOnMarketplace,
        checkMarketplaceSellerRole,
        isLoading,
        isCheckingRole,
        error,
        success,
        txHash,
        approveMarketplaceForNft: approveMarketplaceForNft as any,
        transferNftToAdminMarketplace: transferNftToAdminMarketplace as any,
        isApproving,
        isTransferring,
        approvalError,
        transferError,
        approvalSuccess,
        transferSuccess,
        canPerformAction
    }
} 