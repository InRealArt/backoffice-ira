'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDynamicContext, useWalletConnectorEvent } from '@dynamic-labs/sdk-react-core'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import Button from '@/app/components/Button/Button'
import { getItemById, getNftResourceByItemId, getSmartContractAddress, updateNftResourceStatusToListed } from '@/app/actions/prisma/prismaActions'
import styles from './marketplaceListing.module.scss'
import React from 'react'
import { toast } from 'react-hot-toast'
import { useAccount, useWalletClient } from 'wagmi'
import { publicClient } from '@/lib/providers'
import { parseEther, Address } from 'viem'
import NftStatusBadge from '@/app/components/Nft/NftStatusBadge'
import { CONTRACT_ADDRESSES, ContractName } from '@/constants/contracts'
import { getNetwork } from '@/lib/blockchain/networkConfig'
import { useMarketplaceListing } from '@/app/(admin)/marketplace/hooks/useMarketplaceListing'
import { NetworkType } from '@prisma/client'
import BlockchainAddress from '@/app/components/blockchain/BlockchainAddress'
import { getShopifyProductById } from '@/app/actions/shopify/shopifyActions'
import { getTokenOwner } from '@/lib/blockchain/utils'

type ParamsType = { id: string }

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
  const { 
    listNftOnMarketplace, 
    checkMarketplaceRole,
    approveMarketplaceForNft,
    transferNftToMarketplace,
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
  const [transferStep, setTransferStep] = useState<'idle' | 'approve' | 'transfer' | 'completed'>('idle');

  const unwrappedParams = React.use(params as any) as ParamsType
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
        await checkUserMarketplaceRole(accounts[0]);
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
        await checkUserMarketplaceRole(address);
      }
    }
  );

  // Vérifier le rôle marketplace pour l'utilisateur actuel
  const checkUserMarketplaceRole = async (address: string) => {
    const network = getNetwork()
    const marketplaceAddress = await getSmartContractAddress('Marketplace', network as NetworkType) as Address
    const hasRole = await checkMarketplaceRole(
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
        await checkUserMarketplaceRole(primaryWallet.address as string)
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
    if (!nftResource?.collection?.contractAddress || !nftResource?.tokenId) return;
    
    setIsLoadingOwner(true);
    try {
      const ownerAddress = await getTokenOwner(
        nftResource.tokenId,
        nftResource.collection.contractAddress
      );
      
      setTokenOwner(ownerAddress);
      
      // Vérifier si la marketplace est déjà propriétaire du NFT
      if (ownerAddress) {
        const network = getNetwork();
        const marketplaceAddress = await getSmartContractAddress('Marketplace', network as NetworkType) as Address;
        const isMarketplace = ownerAddress.toLowerCase() === marketplaceAddress.toLowerCase();
        setIsMarketplaceOwner(isMarketplace);
        
        // Si le transfert est déjà complété
        if (isMarketplace) {
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
  
  // Effect pour mettre à jour le statut du transfert en fonction des résultats
  useEffect(() => {
    if (approvalSuccess && transferStep === 'approve') {
      setTransferStep('transfer');
    }
    
    if (transferSuccess) {
      setTransferStep('completed');
      fetchTokenOwner(); // Rafraîchir le propriétaire après le transfert
    }
  }, [approvalSuccess, transferSuccess]);

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
  const canListNft = hasMarketplaceRole && (isMarketplaceOwner || !isNftOwnedByCollectionAdmin);

  // Gérer l'approbation et le transfert
  const handleApproveNft = async () => {
    if (!nftResource?.collection?.contractAddress || !nftResource?.tokenId) return;
    
    const network = getNetwork();
    const marketplaceAddress = await getSmartContractAddress('Marketplace', network as NetworkType) as Address;
    
    await approveMarketplaceForNft({
      collectionAddress: nftResource.collection.contractAddress as Address,
      tokenId: nftResource.tokenId,
      marketplaceAddress,
      walletClient,
      onSuccess: () => {
        toast.success('Approbation réussie. Vous pouvez maintenant transférer le NFT.');
      }
    });
  };
  
  const handleTransferNft = async () => {
    if (!nftResource?.collection?.contractAddress || !nftResource?.tokenId) return;
    
    const network = getNetwork();
    const marketplaceAddress = await getSmartContractAddress('Marketplace', network as NetworkType) as Address;
    
    await transferNftToMarketplace({
      collectionAddress: nftResource.collection.contractAddress as Address,
      tokenId: nftResource.tokenId,
      marketplaceAddress,
      walletClient,
      onSuccess: () => {
        toast.success('NFT transféré avec succès à la marketplace.');
      }
    });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Si un transfert est nécessaire, on ne peut pas lister directement
    if (needsTransferBeforeListing) {
      toast.error('Ce NFT doit d\'abord être transféré à la marketplace avant d\'être listé.');
      return;
    }
    
    // Si l'utilisateur n'a pas les droits nécessaires
    if (!canListNft) {
      toast.error('Vous n\'avez pas les droits nécessaires pour lister ce NFT.');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Conversion du prix de ETH à wei
      const priceInWei = parseEther(formData.price);
      
      // Appel à votre fonction de listing qui interagit avec le contrat
      await listNftOnMarketplace({
        nftResource: {
          id: nftResource.id,
          collection: {
            contractAddress: nftResource.collection.contractAddress as Address
          },
          tokenId: nftResource.tokenId
        },
        price: priceInWei.toString(),
        duration: parseInt(formData.listingDuration),
        publicClient: publicClient as any,
        walletClient: walletClient as any,
        marketplaceManager: marketplaceManager as `0x${string}`,
        onSuccess: async () => {
          // Mettre à jour le statut du NFT en base de données
          try {
            await updateNftResourceStatusToListed(nftResource.id)
          } catch (error) {
            console.error('Erreur lors de la mise à jour du statut:', error)
          }
        }
      })
      
      // Notification de succès
      toast.success('NFT mis en vente avec succès');
      
      // Réinitialisation du formulaire ou redirection
      // ...
    } catch (error) {
      console.error('Erreur lors de la mise en vente:', error);
      toast.error('Échec de la mise en vente du NFT');
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
                <span>Non disponible</span>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Section de transfert - n'afficher que si un transfert est nécessaire ET que l'utilisateur est l'admin Rabby */}
      {canPerformTransfer && (
        <div className={styles.warningBox}>
          <p>En tant qu'admin de la collection, vous devez d'abord transférer ce NFT à la marketplace avant de pouvoir le lister.</p>
          
          <div className={styles.transferActions}>
            {transferStep === 'idle' && (
              <Button
                onClick={() => setTransferStep('approve')}
                variant="primary"
                disabled={!nftResource || isApproving || isTransferring}
              >
                Commencer le transfert à la marketplace (Approbation nécessaire)
              </Button>
            )}
            
            {transferStep === 'approve' && (
              <Button
                onClick={handleApproveNft}
                variant="primary"
                disabled={isApproving}
                isLoading={isApproving}
              >
                {isApproving ? 'Approbation en cours...' : 'Approuver la marketplace pour ce NFT'}
              </Button>
            )}
            
            {transferStep === 'transfer' && (
              <Button
                onClick={handleTransferNft}
                variant="primary"
                disabled={isTransferring}
                isLoading={isTransferring}
              >
                {isTransferring ? 'Transfert en cours...' : 'Transférer le NFT à la marketplace'}
              </Button>
            )}
            
            {transferStep === 'completed' && (
              <div className={styles.successMessage}>
                <p>Le NFT a été transféré avec succès à la marketplace. Vous pouvez maintenant le lister.</p>
              </div>
            )}
            
            {approvalError && <p className={styles.errorText}>{approvalError}</p>}
            {transferError && <p className={styles.errorText}>{transferError}</p>}
          </div>
        </div>
      )}
      
      {/* Message d'erreur si le NFT appartient à l'admin mais l'utilisateur n'est pas Rabby admin */}
      {needsTransferBeforeListing && !isRabbyWalletCollectionAdmin && (
        <div className={styles.errorBox}>
          <p>Ce NFT appartient à l'admin de la collection et doit être transféré à la marketplace avant d'être listé.</p>
          <p>Seul l'admin de la collection connecté via Rabby wallet peut effectuer ce transfert.</p>
        </div>
      )}
      
      <div className={styles.formContainer}>
        <h3 className={styles.formTitle}>Configuration du listing sur la Marketplace</h3>
        
        <form onSubmit={handleSubmit} className={styles.form}>          
          <div className={styles.formGroup}>
            <label htmlFor="price" className={styles.label}>
              Prix (ETH)
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
              className={styles.input}
              required
            />
          </div>
          
          <div className={styles.formActions}>
            <Button
              type="submit"
              variant="primary"
              disabled={
                (!nftResource || 
                nftResource.status !== 'ROYALTYSET' || 
                isListing || 
                !canListNft) ?? false
              }
              isLoading={isListing}
            >
              Lister sur la marketplace
            </Button>
          </div>
          
          {/* Messages explicatifs sous le bouton */}
          {!hasMarketplaceRole && (
            <p className={styles.errorText}>
              Vous n'avez pas les droits d'administrateur de la marketplace.
            </p>
          )}
          
          {needsTransferBeforeListing && (
            <p className={styles.errorText}>
              Ce NFT doit d'abord être transféré à la marketplace avant d'être listé.
            </p>
          )}
        </form>
      </div>
    </div>
  )
}


