'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDynamicContext, useWalletConnectorEvent } from '@dynamic-labs/sdk-react-core'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import Button from '@/app/components/Button/Button'
import { getItemById, getNftResourceByItemId, updateNftResourceStatusToListed } from '@/app/actions/prisma/prismaActions'
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
    isLoading: isListing, 
    error: listingError, 
    success: listingSuccess 
  } = useMarketplaceListing()

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
    const hasRole = await checkMarketplaceRole(
      address,
      CONTRACT_ADDRESSES[network.id][ContractName.NFT_MARKETPLACE]
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
          
          {nftResource.imageUri && (
            <div className={styles.imageContainer}>
              <img 
                src={nftResource.imageUri} 
                alt={nftResource.name} 
                className={styles.nftImage} 
              />
            </div>
          )}
          
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
                <span className={styles.detailLabel}>Contrat:</span>
                <span className={styles.contractAddress}>
                  {`${nftResource.collection.contractAddress.substring(0, 6)}...${nftResource.collection.contractAddress.substring(nftResource.collection.contractAddress.length - 4)}`}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
      
      <div className={styles.formContainer}>
        <h3 className={styles.formTitle}>Configuration du listing</h3>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="nftAddress" className={styles.label}>
              Adresse de la collection NFT
            </label>
            <input
              id="nftAddress"
              name="nftAddress"
              type="text"
              value={nftResource?.collection.contractAddress}
              disabled
              placeholder="0x..."
              className={styles.input}
              required
            />
            <p className={styles.fieldHelp}>Adresse du contrat ERC-721 de la collection</p>
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="tokenId" className={styles.label}>
              ID du token
            </label>
            <input
              id="tokenId"
              name="tokenId"
              type="number"
              value={nftResource?.tokenId}
              disabled
              className={styles.input}
              required
            />
            <p className={styles.fieldHelp}>Identifiant unique du NFT dans la collection</p>
          </div>
          
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
            <p className={styles.fieldHelp}>Prix de vente en ETH (sera converti en wei)</p>
          </div>
          
          <div className={styles.formActions}>
            <Button
              type="submit"
              variant="primary"
              disabled={!nftResource || nftResource.status !== 'ROYALTYSET' || isListing || !hasMarketplaceRole}
              isLoading={isListing}
            >
              {isListing ? 'Listing en cours...' : 'Lister sur la marketplace'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}


