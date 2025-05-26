'use client'

/**
 * Page de listing d'un NFT sur la marketplace
 * 
 * Processus complet selon le test foundry:
 * 
 * 1. Connexion avec le wallet admin de collection NFT (nftProperties.nftAdmin)
 * 2. Le NFT est déjà minté dans la collection (artistNft.mintNFT)
 * 3. Configuration des royalties pour le NFT (artistRoyalties.setRoyalty)
 * 4. Admin de la collection NFT doit transférer directement le NFT à l'admin marketplace:
 *    - Appel à safeTransferFrom(nftAdmin, MARKETPLACE_DEPLOYER, tokenId)
 * 5. Admin marketplace approuve le contrat marketplace pour gérer le NFT:
 *    - Appel à approve(address(marketPlace), tokenId)
 * 6. Admin marketplace liste le NFT sur la marketplace:
 *    - Appel à marketPlace.listItem(artistNft, tokenId, price_)
 * 
 * Cette interface utilisateur guide l'administrateur à travers ces étapes
 * en vérifiant les conditions préalables et en facilitant les transactions
 * blockchain nécessaires.
 */

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDynamicContext, useWalletConnectorEvent } from '@dynamic-labs/sdk-react-core'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import Button from '@/app/components/Button/Button'
import { getItemById, getNftResourceByItemId, getSmartContractAddress, updateNftResourceStatusToListed } from '@/lib/actions/prisma-actions'
import styles from './marketplaceListing.module.scss'
import React from 'react'
import { useToast } from '@/app/components/Toast/ToastContext'
import { useAccount, useWalletClient } from 'wagmi'
import { publicClient } from '@/lib/providers'
import { parseEther, Address } from 'viem'
import NftStatusBadge from '@/app/components/Nft/NftStatusBadge'
import { CONTRACT_ADDRESSES, ContractName } from '@/constants/contracts'
import { getNetwork } from '@/lib/blockchain/networkConfig'
import { useMarketplaceListing } from '@/app/(admin)/marketplace/hooks/useMarketplaceListing'
import { NetworkType } from '@prisma/client'
import BlockchainAddress from '@/app/components/blockchain/BlockchainAddress'
import { getShopifyProductById } from '@/lib/actions/art-actions'
import { getTokenOwner } from '@/lib/blockchain/utils'
import { marketplaceAbi } from '@/lib/contracts/MarketplaceAbi'

type ParamsType = Promise<{ id: string }>

export default function MarketplaceListingPage({ params }: { params: ParamsType }) {
  const router = useRouter()
  const { user, primaryWallet } = useDynamicContext()
  const { address, status, chain } = useAccount()
  const isConnected = status === 'connected'
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [item, setItem] = useState<any>(null)
  const [nftResource, setNftResource] = useState<any>(null)
  const { data: walletClient } = useWalletClient()
  const [hasMarketplaceRole, setHasMarketplaceRole] = useState<boolean>(false)
  const [formData, setFormData] = useState({
    price: '',
    listingDuration: '7' // Default 7 days
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [marketplaceManager, setMarketplaceManager] = useState<Address | null>(null)
  const { success, error: errorToast } = useToast()
  const { 
    listNftOnMarketplace, 
    checkMarketplaceSellerRole,
    approveMarketplaceForNft,
    transferNftToAdminMarketplace,
    isLoading: isListing,
    isApproving,
    isTransferring,
    error: listingError,
    approvalError,
    transferError,
    success: listingSuccess,
    approvalSuccess,
    transferSuccess
  } = useMarketplaceListing()
  const [product, setProduct] = useState<any>(null)
  const [tokenOwner, setTokenOwner] = useState<Address | null>(null);
  const [isLoadingOwner, setIsLoadingOwner] = useState(false);
  const [collectionAdmin, setCollectionAdmin] = useState<Address | null>(null);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(false);
  const [isUserCollectionAdmin, setIsUserCollectionAdmin] = useState(false);
  const [isMarketplaceOwner, setIsMarketplaceOwner] = useState(false);
  const [transferStep, setTransferStep] = useState<
    'idle' | 'transfer' | 'completed'
  >('idle');
  
  // État pour suivre le processus global
  const [listingProcess, setListingProcess] = useState<{
    adminConnected: boolean;
    tokenTransferred: boolean;
    marketplaceApproved: boolean;
    nftApproved: boolean;
    listingComplete: boolean;
  }>({
    adminConnected: false,
    tokenTransferred: false,
    marketplaceApproved: false,
    nftApproved: false,
    listingComplete: false
  });

  // Ajout d'une variable d'état pour suivre l'approbation du NFT
  const [isNftApproved, setIsNftApproved] = useState(false);
  const [isApprovingNft, setIsApprovingNft] = useState(false);

  const [adminMarketplace, setAdminMarketplace] = useState<Address | null>(null);

  const unwrappedParams = React.use(params)
  const id = unwrappedParams.id

  // États pour les champs du formulaire
  const [nftAddress, setNftAddress] = useState('');
  const [tokenId, setTokenId] = useState(0);
  const [price, setPrice] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Gestion du changement de compte wallet
  useWalletConnectorEvent(
    primaryWallet?.connector, 
    'accountChange',
    async ({ accounts }, connector) => {
      if (connector.name === 'Rabby') {
        console.log('Rabby wallet account changed:', accounts);
        await checkUserMarketplaceSellerRole(accounts[0]);
      }
    }
  );

  // Gestion du changement de réseau
  useWalletConnectorEvent(
    primaryWallet?.connector,
    'chainChange',
    async ({ chain }, connector) => {
      console.log('Changement de chaîne détecté:', chain);
      if (address) {
        await checkUserMarketplaceSellerRole(address);
      }
    }
  );

  // Vérifier le rôle marketplace pour l'utilisateur actuel
  const checkUserMarketplaceSellerRole = async (address: string) => {
    const network = getNetwork()
    const marketplaceAddress = await getSmartContractAddress('Marketplace', network as NetworkType) as Address
    const hasRole = await checkMarketplaceSellerRole(
      address,
      marketplaceAddress
    )
    if (hasRole) {
      setMarketplaceManager(address as Address)
    }
    setHasMarketplaceRole(hasRole)
  }

  // Vérifier initialement le rôle de l'utilisateur
  useEffect(() => {
    const checkInitialMarketplaceRole = async () => {
      if (
        primaryWallet?.connector?.name === 'Rabby' && 
        primaryWallet?.address
      ) {
        console.log('Adresse Rabby détectée:', primaryWallet.address)
        await checkUserMarketplaceSellerRole(primaryWallet.address as string)
      }
    }

    checkInitialMarketplaceRole()
  }, [primaryWallet?.address])
  
  useEffect(() => {
    if (!user?.email) {
      setError('Vous devez être connecté pour accéder à cette page')
      setIsLoading(false)
      return
    }

    let isMounted = true
    
    const fetchItem = async () => {
      try {
        const itemResult = await getItemById(Number(id))
        if (isMounted) {
          if (itemResult && itemResult.id) {
            setItem(itemResult)
            //console.log('Item récupéré:', itemResult)
            // Récupérer les données du produit Shopify d'abord
            if (itemResult.id) {
              try {
                const productResult = await getShopifyProductById(itemResult.id)
                if (productResult && productResult.success) {
                  //console.log('Produit Shopify récupéré:', productResult.product)
                  setProduct(productResult.product)
                } else {
                  console.error('Erreur lors de la récupération du produit Shopify:', productResult || 'Erreur inconnue')
                }
              } catch (shopifyError) {
                console.error('Exception lors de la récupération du produit Shopify:', shopifyError)
              }
            }
            
            // Ensuite récupérer la ressource NFT
            try {
              const nftResourceResult = await getNftResourceByItemId(itemResult.id)
              if (nftResourceResult) {
                if (nftResourceResult.status !== 'ROYALTYSET') {
                  setError('Ce NFT n\'a pas encore ses royalties configurées')
                  setIsLoading(false)
                  return
                }
                setNftResource(nftResourceResult)
              }
            } catch (resourceError) {
              console.error('Erreur lors de la récupération du NFT resource:', resourceError)
              setError('Erreur lors de la récupération des données du NFT')
            }
          } else {
            setError('Impossible de trouver cet item')
          }
          setIsLoading(false)
        }
      } catch (error: any) {
        console.error('Erreur lors du chargement de l\'item:', error)
        if (isMounted) {
          setError(error.message || 'Une erreur est survenue')
          setIsLoading(false)
        }
      }
    }

    fetchItem()
    
    return () => {
      isMounted = false
    }
  }, [id, user?.email])

  const checkCollectionAdmin = () => {
    if (!nftResource?.collection?.addressAdmin || !primaryWallet?.address) return;  
    //console.log('collectionAdmin', nftResource.collection.addressAdmin)
    setCollectionAdmin(nftResource.collection.addressAdmin as Address);
    console.log('primaryWallet.address', primaryWallet.address)
    // Vérifier si l'utilisateur est l'admin de la collection
    const isAdmin = nftResource.collection.addressAdmin.toLowerCase() === primaryWallet.address.toLowerCase();
    setIsUserCollectionAdmin(isAdmin);
  };
  
  useEffect(() => {
    if (nftResource?.collection?.contractAddress) {
      fetchTokenOwner();
      checkCollectionAdmin();
    }
  }, [nftResource, primaryWallet?.address]); // Ajouter primaryWallet?.address comme dépendance
  
  // Récupérer le propriétaire du NFT
  const fetchTokenOwner = async () => {
    console.log('fetchTokenOwner !!!')
    if (!nftResource?.collection?.contractAddress || !nftResource?.tokenId) return;
    
    setIsLoadingOwner(true);
    try {
      const ownerAddress = await getTokenOwner(
        nftResource.tokenId,
        nftResource.collection.contractAddress
      );
      
      setTokenOwner(ownerAddress);
      
      // Vérifier si l'admin de la marketplace est déjà propriétaire du NFT
      if (ownerAddress) {
        let marketplaceAdminAddress: Address;
        
        // Utiliser adminMarketplace s'il existe déjà, sinon le récupérer
        if (adminMarketplace) {
          marketplaceAdminAddress = adminMarketplace;
          console.log("[DEBUG] Utilisation de l'adresse admin marketplace existante:", marketplaceAdminAddress);
        } else {
          const network = getNetwork();
          const marketplaceAddress = await getSmartContractAddress('Marketplace', network as NetworkType) as Address;
          
          // Récupérer l'adresse du super admin via getSuperAdmin
          try {
            marketplaceAdminAddress = await publicClient.readContract({
              address: marketplaceAddress,
              abi: marketplaceAbi,
              functionName: 'getSuperAdmin',
            }) as Address;
            
            console.log("[DEBUG] Adresse du super admin de la marketplace récupérée:", marketplaceAdminAddress);
            
            if (!marketplaceAdminAddress || marketplaceAdminAddress === '0x0000000000000000000000000000000000000000') {
              throw new Error("L'adresse du super admin de la marketplace est invalide ou non définie");
            }
            
            // Stocker l'adresse de l'admin marketplace dans l'état
            setAdminMarketplace(marketplaceAdminAddress);
          } catch (error) {
            console.error("Erreur lors de la récupération de l'adresse du super admin:", error);
            setIsMarketplaceOwner(false);
            setIsLoadingOwner(false);
            return;
          }
        }
        
        // Vérifier si le propriétaire est l'admin de la marketplace
        const isMarketplaceAdmin = ownerAddress.toLowerCase() === marketplaceAdminAddress.toLowerCase();
        setIsMarketplaceOwner(isMarketplaceAdmin);
        
        // Si le transfert est déjà complété
        if (isMarketplaceAdmin) {
          setTransferStep('completed');
        }
      }
      
    } catch (error) {
      console.error('Erreur lors de la récupération du propriétaire du NFT:', error);
      setTokenOwner(null);
    } finally {
      setIsLoadingOwner(false);
    }
  };
  
  // Vérifier si le NFT est déjà approuvé pour le contrat Marketplace
  const checkNftApproval = async () => {
    if (!nftResource?.collection?.contractAddress || !nftResource?.tokenId) return;
    
    try {
      // Créer l'ABI pour appeler getApproved
      const erc721ABI = [
        {
          name: 'getApproved',
          type: 'function',
          stateMutability: 'view',
          inputs: [{ name: 'tokenId', type: 'uint256' }],
          outputs: [{ name: '', type: 'address' }]
        }
      ];
      
      const network = getNetwork();
      const marketplaceAddress = await getSmartContractAddress('Marketplace', network as NetworkType) as Address;
      
      // Appeler getApproved sur le contrat
      const approvedAddress = await publicClient.readContract({
        address: nftResource.collection.contractAddress as Address,
        abi: erc721ABI,
        functionName: 'getApproved',
        args: [BigInt(nftResource.tokenId)]
      }) as Address;
      
      // Vérifier si l'adresse approuvée est celle du contrat Marketplace
      const isApproved = approvedAddress.toLowerCase() === marketplaceAddress.toLowerCase();
      console.log('Vérification d\'approbation: NFT approuvé pour marketplace?', isApproved);
      setIsNftApproved(isApproved);
      
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'approbation du NFT:', error);
    }
  };
  
  // Mise à jour du processus global pour inclure l'étape d'approbation
  useEffect(() => {
    setListingProcess({
      adminConnected: isUserCollectionAdmin,
      tokenTransferred: isMarketplaceOwner,
      marketplaceApproved: hasMarketplaceRole,
      nftApproved: isNftApproved,
      listingComplete: listingSuccess || nftResource?.status === 'LISTED'
    });
  }, [isUserCollectionAdmin, isMarketplaceOwner, hasMarketplaceRole, isNftApproved, listingSuccess, nftResource?.status]);
  
  // Vérifier l'approbation du NFT lorsque les données sont chargées
  useEffect(() => {
    if (nftResource?.collection?.contractAddress && nftResource?.tokenId && isMarketplaceOwner) {
      checkNftApproval();
    }
  }, [nftResource, isMarketplaceOwner]);

  // Effect pour les transitions d'état
  useEffect(() => {
    if (transferSuccess) {
      setTransferStep('completed');
      success('NFT transféré avec succès. L\'admin marketplace peut maintenant le lister.');
      fetchTokenOwner(); // Rafraîchir le propriétaire après le transfert
    }
  }, [transferSuccess]);

  // Condition: le NFT est détenu par l'admin de la collection
  const isNftOwnedByCollectionAdmin = tokenOwner && collectionAdmin && 
    tokenOwner.toLowerCase() === collectionAdmin.toLowerCase();
  
  // Condition: l'utilisateur connecté utilise Rabby et est l'admin de la collection
  const isRabbyWalletCollectionAdmin = primaryWallet?.connector?.name === 'Rabby' && isUserCollectionAdmin;
  
  // Condition: le NFT doit être transféré avant d'être listé
  const needsTransferBeforeListing = isNftOwnedByCollectionAdmin && !isMarketplaceOwner;
  
  // Condition: l'utilisateur peut effectuer le transfert
  const canPerformTransfer = isRabbyWalletCollectionAdmin && needsTransferBeforeListing;
  
  // Condition: l'utilisateur peut lister le NFT
  const canListNft = hasMarketplaceRole && isMarketplaceOwner && isNftApproved;

  // Fonction pour initialiser le processus de transfert direct
  const handleTransferProcess = async () => {
    if (!nftResource?.collection?.contractAddress || !nftResource?.tokenId) {
      errorToast('Informations du NFT non disponibles');
      return;
    }
    
    try {
      const network = getNetwork();
      // Récupérer l'adresse de l'admin de la marketplace (dans un cas réel)
      // Pour simplifier, nous utilisons l'adresse du contrat marketplace comme proxy
      const marketplaceAdminAddress = await getSmartContractAddress('Marketplace', network as NetworkType) as Address;
      
      // Informer l'utilisateur de l'action à entreprendre
      success('Vous allez maintenant transférer le NFT à l\'admin de la marketplace');
      
      // Initier le processus (transfert direct)
      setTransferStep('transfer');
      
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du processus de transfert:', error);
      errorToast('Impossible d\'initialiser le processus de transfert');
      setTransferStep('idle');
    }
  };
  
  // Fonction de transfert du NFT directement à l'admin marketplace
  const handleTransferNft = async () => {
    if (!nftResource?.collection?.contractAddress || !nftResource?.tokenId) {
      errorToast('Informations du NFT non disponibles');
      return;
    }
    
    if (!walletClient) {
      errorToast('Portefeuille non connecté ou non disponible');
      return;
    }
    
    try {
      const network = getNetwork();
      
      // Récupération de l'adresse du contrat Marketplace
      const marketplaceAddress = await getSmartContractAddress('Marketplace', network as NetworkType) as Address;
      
      // Récupération de l'adresse de l'admin de la marketplace via la fonction getSuperAdmin
      let marketplaceAdminAddress: Address;
      try {
        // Appel à la fonction getSuperAdmin du contrat Marketplace
        marketplaceAdminAddress = await publicClient.readContract({
          address: marketplaceAddress,
          abi: marketplaceAbi,
          functionName: 'getSuperAdmin',
        }) as Address;
        
        console.log("[DEBUG] Adresse du super admin de la marketplace:", marketplaceAdminAddress);
        
        if (!marketplaceAdminAddress || marketplaceAdminAddress === '0x0000000000000000000000000000000000000000') {
          throw new Error("L'adresse du super admin de la marketplace est invalide ou non définie");
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de l'adresse du super admin:", error);
        errorToast("Impossible de récupérer l'adresse de l'administrateur de la marketplace");
        return;
      }
      
      console.log("[DEBUG] Transfert vers l'adresse du super admin marketplace:", marketplaceAdminAddress);
      
      console.log("marketplaceAdminAddress : ", marketplaceAdminAddress)
      console.log("nftResource.collection.contractAddress : ", nftResource.collection.contractAddress)
      console.log("walletClient : ", walletClient)
      // Utilisation de transferNftToAdminMarketplace mais en spécifiant qu'il s'agit d'un appel à safeTransferFrom
      // Comme dans le test foundry: artistNft.safeTransferFrom(nftProperties.nftAdmin, MARKETPLACE_DEPLOYER, tokenId)
      await transferNftToAdminMarketplace({
        collectionAddress: nftResource.collection.contractAddress as Address,
        tokenId: nftResource.tokenId,
        adminMarketplace: marketplaceAdminAddress, // Adresse du super admin marketplace (personne)
        walletClient,
        onSuccess: () => {
          success("NFT transféré avec succès à l'administrateur de la marketplace");
          setTransferStep('completed');
          setListingProcess(prev => ({...prev, tokenTransferred: true}));
          fetchTokenOwner(); // Rafraîchir le propriétaire après le transfert
        }
      });
      
    } catch (error: any) {
      console.error('Erreur lors du transfert du NFT:', error);
      errorToast(`Erreur lors du safeTransferFrom: ${error.message || 'Erreur inconnue'}`);
    }
  };

  // Fonction pour approuver le smart contract Marketplace pour ce NFT
  const handleApproveNftForMarketplace = async () => {
    if (!nftResource?.collection?.contractAddress || !nftResource?.tokenId) {
      errorToast('Informations du NFT non disponibles');
      return;
    }
    console.log('walletClient', walletClient)
    if (!walletClient) {
      errorToast('Portefeuille non connecté ou non disponible');
      return;
    }

    setIsApprovingNft(true);
    
    try {
      const network = getNetwork();
      const marketplaceAddress = await getSmartContractAddress('Marketplace', network as NetworkType) as Address;
      console.log('[DEBUG] Approbation du NFT', {
        collection: nftResource.collection.contractAddress,
        tokenId: nftResource.tokenId,
        marketplaceAddress,
        owner: tokenOwner
      });
      
      // Utiliser directement la fonction approveMarketplaceForNft du hook
      await approveMarketplaceForNft({
        collectionAddress: nftResource.collection.contractAddress as Address,
        tokenId: nftResource.tokenId,
        marketplaceAddress,
        walletClient,
        onSuccess: () => {
          success('Le NFT a été approuvé avec succès pour être géré par le smart contract Marketplace');
          setIsNftApproved(true);
          // Vérifier l'approbation pour confirmer
          setTimeout(() => checkNftApproval(), 2000);
        }
      });
      
    } catch (error: any) {
      console.error('Erreur lors de l\'approbation du NFT:', error);
      
      // Analyse détaillée de l'erreur
      let errorMessage = error.message || 'Erreur inconnue';
      let verboseError = 'Impossible d\'analyser la raison exacte';
      
      console.log('[DEBUG] Erreur complète:', error);
      
      // Détection spécifique des erreurs Rabby et Ethereum
      if (error.code) {
        console.log('[DEBUG] Code d\'erreur Rabby/Ethereum:', error.code);
      }
      
      // Extraction d'informations plus détaillées sur la raison du revert
      if (error.reason) {
        verboseError = `Raison: ${error.reason}`;
      }
      
      if (error.data) {
        console.log('[DEBUG] Données d\'erreur supplémentaires:', error.data);
        
        // Si l'erreur contient des données structurées
        if (typeof error.data === 'string') {
          verboseError = `Données d'erreur: ${error.data}`;
        } else if (error.data.message) {
          verboseError = `Message: ${error.data.message}`;
        }
      }
      
      // Extraction d'une raison de revert possible
      if (errorMessage.includes('execution reverted')) {
        // Tenter d'extraire le message d'erreur après "execution reverted:"
        const revertMatch = errorMessage.match(/execution reverted:(.+?)(?:\s*\(|$)/);
        if (revertMatch && revertMatch[1]) {
          verboseError = `Revert: ${revertMatch[1].trim()}`;
        }
      }
      
      // Raisons courantes de revert dans les fonctions approve d'ERC721
      if (
        errorMessage.toLowerCase().includes('not owner') || 
        errorMessage.toLowerCase().includes('owner') ||
        errorMessage.toLowerCase().includes('caller is not')
      ) {
        verboseError = "Le portefeuille actuel n'est pas le propriétaire du NFT. Seul le propriétaire peut approuver.";
      }
      
      if (errorMessage.toLowerCase().includes('approve to caller')) {
        verboseError = "Impossible d'approuver pour l'adresse appelante elle-même.";
      }
      
      if (errorMessage.toLowerCase().includes('already approved')) {
        verboseError = "Ce NFT est déjà approuvé pour cette adresse.";
        // Vérifier si c'est approuvé pour notre marketplace
        setTimeout(() => checkNftApproval(), 1000);
      }
      
      // Afficher à la fois un message toast et un log détaillé
      errorToast(`Erreur lors de l'approbation: ${verboseError}`);
      console.error('[VERBOSE ERROR]', {
        message: errorMessage,
        code: error.code,
        data: error.data,
        reason: error.reason,
        verboseError
      });
      
      // Vérifier quand même le statut d'approbation après un échec
      setTimeout(() => checkNftApproval(), 3000);
      
    } finally {
      setIsApprovingNft(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value
    })
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}
    
    // Validation du prix
    if (!formData.price) {
      errors.price = 'Le prix est requis'
    } else if (isNaN(Number(formData.price)) || Number(formData.price) <= 0) {
      errors.price = 'Le prix doit être un nombre positif'
    }
    
    // Validation de la durée
    if (!formData.listingDuration) {
      errors.listingDuration = 'La durée d\'affichage est requise'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Version améliorée de handleSubmit
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!validateForm()) {
      errorToast('Veuillez corriger les erreurs du formulaire');
      return;
    }
    
    // Vérifications pour s'assurer que toutes les conditions sont remplies
    if (!hasMarketplaceRole) {
      errorToast('Vous devez avoir le rôle d\'admin marketplace pour lister un NFT');
      return;
    }
    
    if (!isMarketplaceOwner) {
      errorToast('Vous devez être propriétaire du NFT pour le lister');
      return;
    }
    
    if (!isNftApproved) {
      errorToast('Vous devez d\'abord approuver le contrat marketplace pour gérer ce NFT');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Conversion du prix de ETH à wei
      const priceInWei = parseEther(formData.price);
      
      // Appel à la fonction de listing qui interagit avec le contrat
      await listNftOnMarketplace({
        nftResource: {
          id: nftResource.id,
          collection: {
            contractAddress: nftResource.collection.contractAddress as Address
          },
          tokenId: nftResource.tokenId
        },
        price: priceInWei.toString(),
        publicClient: publicClient as any,
        walletClient: walletClient as any,
        marketplaceManager: marketplaceManager as `0x${string}`,
        onSuccess: async () => {
          // Mettre à jour le statut du NFT en base de données
          try {
            await updateNftResourceStatusToListed(nftResource.id);
            setListingProcess(prev => ({...prev, listingComplete: true}));
            // Notification de succès
            success('NFT mis en vente avec succès');
            router.refresh(); // Rafraîchir la page pour mettre à jour les données
          } catch (error) {
            console.error('Erreur lors de la mise à jour du statut:', error);
          }
        }
      });
      
      
    } catch (error) {
      console.error('Erreur lors de la mise en vente:', error);
      errorToast('Échec de la mise en vente du NFT');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingSpinner size="large" message="Chargement des informations..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorMessage}>{error}</div>
        <Button 
          onClick={() => router.push('/marketplace/marketplaceListing')}
          variant="secondary"
        >
          Retourner à la liste
        </Button>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Lister un NFT sur la marketplace</h1>
        <Button 
          onClick={() => router.push('/marketplace/marketplaceListing')}
          variant="secondary"
        >
          Retour
        </Button>
      </div>
      
      {!hasMarketplaceRole && (
        <div className={styles.warningBox}>
          <p>Vous n'avez pas les droits nécessaires pour lister des NFTs sur la marketplace.</p>
        </div>
      )}
      
      {nftResource && (
        <div className={styles.nftInfo}>
          <div className={styles.nftHeader}>
            <h2>{nftResource.name}</h2>
            <NftStatusBadge status={nftResource.status} />
          </div>
          
          <div className={styles.imageSection}>
            {product && product.imageUrl ? (
              <div className={styles.imageContainer}>
                <img 
                  src={product.imageUrl} 
                  alt={nftResource.name} 
                  className={styles.nftImage} 
                />
              </div>
            ) : nftResource.imageUri ? (
              <div className={styles.imageContainer}>
                <img 
                  src={nftResource.imageUri} 
                  alt={nftResource.name} 
                  className={styles.nftImage} 
                />
              </div>
            ) : (
              <div className={styles.noImage}>Aucune image disponible</div>
            )}
          </div>
          
          <div className={styles.nftDetails}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>ID Token:</span>
              <span>{nftResource.tokenId || 'N/A'}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Collection:</span>
              <span>{nftResource.collection?.name || 'N/A'}</span>
            </div>
            {nftResource.collection?.contractAddress && (
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Adresse de la collection NFT :</span>
                <BlockchainAddress 
                  address={nftResource.collection.contractAddress} 
                  network={item?.network?.toLowerCase() || 'sepolia'}
                  showExplorerLink={true}
                  className={styles.contractAddress}
                />
              </div>
            )}
            
            {/* Affichage du propriétaire du NFT */}
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Propriétaire du NFT :</span>
              {isLoadingOwner ? (
                <span>Chargement du propriétaire...</span>
              ) : tokenOwner ? (
                <BlockchainAddress 
                  address={tokenOwner} 
                  network={item?.network?.toLowerCase() || 'sepolia'}
                  showExplorerLink={true}
                  className={styles.contractAddress}
                />
              ) : (
                <span>Non disponible</span>
              )}
            </div>
            
            {/* Affichage de l'admin de la collection */}
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Admin de la collection :</span>
              {collectionAdmin ? (
                <BlockchainAddress 
                  address={collectionAdmin} 
                  network={item?.network?.toLowerCase() || 'sepolia'}
                  showExplorerLink={true}
                  className={styles.contractAddress}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Non disponible</p>
              )}
            </div>
            
            {/* Affichage de l'admin de la marketplace */}
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Admin de la marketplace :</span>
              {adminMarketplace ? (
                <BlockchainAddress address={adminMarketplace} network={item?.network?.toLowerCase() || 'sepolia'}
                showExplorerLink={true}
                className={styles.contractAddress}/>
              ) : (
                <p className="text-sm text-muted-foreground">Non disponible</p>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Message d'erreur si le NFT appartient à l'admin mais l'utilisateur n'est pas Rabby admin */}
      {needsTransferBeforeListing && !isRabbyWalletCollectionAdmin && (
        <div className={styles.errorBox}>
          <p>Pour être listé, les actions suivantes doivent être réalisées dans cet ordre :</p>
          <ol className={styles.stepsList}>
            <li>Connectez-vous à Rabby wallet avec le compte admin de la collection NFT</li>
            <li>Transférez le NFT directement à l'admin de la marketplace via safeTransferFrom</li>
            <li>L'admin de la marketplace doit approuver le smart contract marketplace pour ce NFT</li>
            <li>L'admin marketplace doit approuver le contrat marketplace pour gérer ce NFT spécifique</li>
            <li>L'admin de la marketplace peut alors lister le NFT avec un prix</li>
          </ol>
        </div>
      )}
      
      {/* Affichage du workflow détaillé */}
      <div className={styles.workflowContainer}>
        <h3 className={styles.workflowTitle}>Processus de mise en vente</h3>
        <div className={styles.workflowSteps}>
          <div className={`${styles.workflowStep} ${isUserCollectionAdmin ? styles.active : ''}`}>
            <div className={styles.stepNumber}>1</div>
            <div className={styles.stepContent}>
              <h4>Connexion admin collection NFT</h4>
              <p>Connectez-vous avec Rabby wallet en tant qu'admin de la collection NFT</p>
              <div className={styles.stepStatus}>
                {isUserCollectionAdmin ? '✓ Complété' : '○ En attente'}
              </div>
              {!isUserCollectionAdmin && (
                <div className={styles.stepAction}>
                  <Button
                    variant="secondary"
                    onClick={() => success('Veuillez vous connecter avec Rabby wallet en tant qu\'admin de la collection')}
                    size="small"
                  >
                    Se connecter avec Rabby
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <div className={`${styles.workflowStep} ${transferStep === 'completed' ? styles.active : ''}`}>
            <div className={styles.stepNumber}>2</div>
            <div className={styles.stepContent}>
              <h4>Transfert direct du NFT</h4>
              <p>Transfert du NFT via <code>safeTransferFrom</code> depuis l'admin collection vers l'admin marketplace</p>
              <div className={styles.stepStatus}>
                {isMarketplaceOwner ? '✓ Complété' : '○ En attente'}
              </div>
              {isUserCollectionAdmin && !isMarketplaceOwner && (
                <div className={styles.stepAction}>
                  {transferStep === 'idle' && (
                    <Button
                      onClick={handleTransferProcess}
                      variant="secondary"
                      disabled={!nftResource || isTransferring}
                      size="small"
                    >
                      Transférer le NFT
                    </Button>
                  )}
                  {transferStep === 'transfer' && (
                    <Button
                      onClick={handleTransferNft}
                      variant="secondary"
                      disabled={isTransferring}
                      isLoading={isTransferring}
                      size="small"
                    >
                      {isTransferring ? 'Transfert en cours...' : 'Confirmer le transfert'}
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
          
          <div className={`${styles.workflowStep} ${hasMarketplaceRole ? styles.active : ''}`}>
            <div className={styles.stepNumber}>3</div>
            <div className={styles.stepContent}>
              <h4>Connexion admin Marketplace</h4>
              <p>Connectez vous avec Rabby en tant qu'admin de la Marketplace</p>
              <div className={styles.stepStatus}>
                {hasMarketplaceRole ? '✓ Complété' : '○ En attente'}
              </div>
              {isMarketplaceOwner && !hasMarketplaceRole && (
                <div className={styles.stepAction}>
                  <Button
                    variant="secondary"
                    onClick={() => success('Connectez-vous avec un compte ayant le rôle SELLER_ROLE sur la marketplace')}
                    size="small"
                  >
                    Connecter admin marketplace
                  </Button>
                </div>
              )}
            </div>
          </div>
          
          <div className={`${styles.workflowStep} ${isNftApproved ? styles.active : ''}`}>
            <div className={styles.stepNumber}>4</div>
            <div className={styles.stepContent}>
              <h4>Approbation du NFT pour le contrat</h4>
              <p>L'admin marketplace autorise le smart contract <code>Marketplace</code> à gérer ce NFT spécifique via <code>approve</code></p>
              <div className={styles.stepStatus}>
                {isNftApproved ? '✓ Complété' : '○ En attente'}
              </div>
              {/*<div>
                    <p>
                      {hasMarketplaceRole ? 'hasMarketplaceRole OK' : 'hasMarketplaceRole KO'}<br/>
                      {isMarketplaceOwner ? 'isMarketplaceOwner OK' : 'isMarketplaceOwner KO'}<br/>
                      {isNftApproved ? 'isNftApproved OK' : 'isNftApproved KO'}<br/>
                      {walletClient ? 'walletClient OK' : 'walletClient KO'}
                    </p>
              </div>*/}
              {hasMarketplaceRole && isMarketplaceOwner && !isNftApproved && walletClient && (
                <div className={styles.stepAction}>
                  <Button
                    variant="secondary"
                    onClick={handleApproveNftForMarketplace}
                    disabled={isApprovingNft || !walletClient}
                    isLoading={isApprovingNft}
                    size="small"
                  >
                    {isApprovingNft ? 'Approbation en cours...' : 'Approuver pour le contrat de Marketplace'}
                  </Button>
                  
                
                </div>
                
              )}
            </div>
          </div>
          
          <div className={`${styles.workflowStep} ${listingProcess.listingComplete ? styles.active : ''}`}>
            <div className={styles.stepNumber}>5</div>
            <div className={styles.stepContent}>
              <h4>Mise en vente</h4>
              <p>L'admin marketplace liste le NFT sur la marketplace avec un prix</p>
              <div className={styles.stepStatus}>
                {listingProcess.listingComplete ? '✓ Complété' : '○ En attente'}
              </div>
              {hasMarketplaceRole && isMarketplaceOwner && isNftApproved && !listingProcess.listingComplete && (
                <div className={styles.stepAction}>
                  <div className={styles.priceListing}>
                    <div className={styles.formGroup}>
                      <label htmlFor="price" className={styles.label}>
                        Prix en ETH
                      </label>
                      <input
                        id="price"
                        name="price"
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({
                          ...formData,
                          price: e.target.value
                        })}
                        min="0"
                        step="0.001"
                        className={`${styles.input} ${formErrors.price ? styles.inputError : ''}`}
                        placeholder="ex: 0.25"
                        required
                      />
                      {formErrors.price && <p className={styles.errorText}>{formErrors.price}</p>}
                    </div>
                    
                    <Button
                      onClick={handleSubmit}
                      variant="secondary"
                      disabled={!formData.price || isListing}
                      isLoading={isListing}
                      size="small"
                    >
                      {isListing ? 'Mise en vente en cours...' : 'Lister le NFT'}
                    </Button>
                    
                    {listingSuccess && (
                      <div className={styles.successMessage}>
                        NFT listé avec succès !
                      </div>
                    )}
                    
                    {listingError && (
                      <div className={styles.errorText}>
                        Erreur : {listingError}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
    </div>
  )
}



