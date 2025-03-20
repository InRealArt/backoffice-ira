'use client'

import { useState, useEffect, Usable } from 'react'
import { useRouter } from 'next/navigation'
import { useDynamicContext, useWalletConnectorEvent } from '@dynamic-labs/sdk-react-core'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import Button from '@/app/components/Button/Button'
import { getShopifyProductById } from '@/app/actions/shopify/shopifyActions'
import { getAuthCertificateByItemId, getItemByShopifyId, getUserByItemId, getNftResourceByItemId, getActiveCollections, getSmartContractAddress } from '@/app/actions/prisma/prismaActions'
import styles from './royaltySettings.module.scss'
import React from 'react'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import { useAccount, useWalletClient } from 'wagmi'
import { publicClient } from '@/lib/providers'
import { Address, WalletClient } from 'viem'
import { useNftMinting } from '../../../hooks/useNftMinting'
import NftStatusBadge from '@/app/components/Nft/NftStatusBadge'
import { InRealArtRoles, InRealArtSmartContractConstants } from '@/lib/blockchain/smartContractConstants'
import { artistRoyaltiesAbi } from '@/lib/contracts/ArtistRoyaltiesAbi'
import { CONTRACT_ADDRESSES, ContractName } from '@/constants/contracts'
import { getNetwork } from '@/lib/blockchain/networkConfig'
import { isValidEthereumAddress } from '@/lib/blockchain/utils'
import { useRoyaltySettings } from '@/app/(admin)/marketplace/hooks/useRoyaltySettings'
import IpfsUriField from '@/app/components/Marketplace/IpfsUriField'
import { NetworkType } from '@prisma/client'
import { getBlockExplorerUrl } from '@/lib/blockchain/explorerUtils'

type ParamsType = { id: string }

export default function ViewRoyaltysettingPage({ params }: { params: ParamsType }) {
  const router = useRouter()
  const { user, primaryWallet } = useDynamicContext()
  const { address, status, chain } = useAccount()
  const isConnected = status === 'connected'
  const [isLoading, setIsLoading] = useState(true)
  const [product, setProduct] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [certificate, setCertificate] = useState<any>(null)
  const [productOwner, setProductOwner] = useState<any>(null)
  const [item, setItem] = useState<any>(null)
  const [showUploadIpfsForm, setShowUploadIpfsForm] = useState(false)
  const [collections, setCollections] = useState<any[]>([])
  const [nftResource, setNftResource] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    collection: '',
    image: null as File | null,
    certificate: null as File | null,
    intellectualProperty: false
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const { data: walletClient } = useWalletClient()
  const [hasRoyaltyRole, setHasRoyaltyRole] = useState<boolean>(false)
  const [isCheckingRole, setIsCheckingRole] = useState<boolean>(false)
  const { configureRoyalties, isLoading: isConfiguring, error: configureError, success: configureSuccess } = useRoyaltySettings()

  const unwrappedParams = React.use(params as any) as ParamsType
  const id = unwrappedParams.id
  
  const [royalties, setRoyalties] = useState<Array<{address: string, percentage: string}>>([
    { address: '', percentage: '' }
  ])
  const [totalPercentage, setTotalPercentage] = useState<number>(0)
  const [totalPercentageBeneficiaries, setTotalPercentageBeneficiaries] = useState<number>(0)
  const [allBeneficaryAddress, setAllBeneficaryAddress] = useState<boolean>(false)
  const [royaltiesSettingsOk, setRoyaltiesSettingsOk] = useState<boolean>(false)
  const [royaltiesManager, setRoyaltiesManager] = useState<Address | null>(null)

  const fetchCollections = async () => {
    try {
      const collectionsData = await getActiveCollections()
      if (collectionsData && Array.isArray(collectionsData)) {
        setCollections(collectionsData)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des collections:', error)
    }
  }

  useWalletConnectorEvent(
    primaryWallet?.connector, 
    'accountChange',
    async ({ accounts }, connector) => {
      if (connector.name === 'Rabby') {
        console.log('Rabby wallet account changed:', accounts);
        await checkUserRoyaltyRole(accounts[0]);
      }
    }
  );

  useWalletConnectorEvent(
    primaryWallet?.connector,
    'chainChange',
    async ({ chain }, connector) => {
      console.log('Changement de chaîne détecté via useWalletConnectorEvent:', chain);
      if (address) {
        await checkUserRoyaltyRole(address);
      }
    }
  );
  
  useEffect(() => {
    const checkInitialMinterStatus = async () => {
      console.log('Vérification initiale du statut minter - primaryWallet:', {
        primaryWalletAddress: primaryWallet?.address,
        nftResource: nftResource?.collection?.contractAddress
      })

      if (
        primaryWallet?.connector?.name === 'Rabby' && 
        primaryWallet?.address && 
        nftResource?.collection?.contractAddress
      ) {
        console.log('Adresse Rabby détectée:', primaryWallet.address)
        await checkUserRoyaltyRole(primaryWallet.address as string)
      }
    }

    checkInitialMinterStatus()
  }, [primaryWallet?.address, nftResource])

  useEffect(() => {
    if (!user?.email) {
      setError('Vous devez être connecté pour visualiser ce produit')
      setIsLoading(false)
      return
    }

    let isMounted = true
    
    const fetchProduct = async () => {
      try {
        const productId = id.includes('gid://shopify/Product/') 
          ? id.split('/').pop() 
          : id
        
        const result = await getShopifyProductById(productId as string)
        if (isMounted) {
          if (result.success && result.product) {
            setProduct(result.product)
            
            const shopifyProductId = typeof result.product.id === 'string' 
              ? BigInt(result.product.id.replace('gid://shopify/Product/', ''))
              : BigInt(result.product.id)

            const itemResult = await getItemByShopifyId(shopifyProductId)
            if (itemResult?.id) {
              setItem(itemResult)
              try {
                const certificateResult = await getAuthCertificateByItemId(itemResult.id)
                if (certificateResult && certificateResult.id) {
                  setCertificate(certificateResult)
                }
                
                const ownerResult = await getUserByItemId(itemResult.id)
                if (ownerResult) {
                  setProductOwner(ownerResult)
                }
                
                console.log('itemResult : ', itemResult)
                const nftResourceResult = await getNftResourceByItemId(itemResult.id)
                console.log('nftResourceResult : ', nftResourceResult)
                fetchCollections()
                if (nftResourceResult) {
                  setNftResource(nftResourceResult)
                  if (nftResourceResult.status === 'UPLOADIPFS') {
                    setFormData(prevData => ({
                      ...prevData,
                      name: nftResourceResult.name || '',
                      description: nftResourceResult.description || '',
                      collection: nftResourceResult.collectionId?.toString() || ''
                    }))
                  }
                }
              } catch (certError) {
                console.error('Erreur lors de la récupération des données:', certError)
              }
            }
          } else {
            setError(result.message || 'Impossible de charger ce produit')
          }
          setIsLoading(false)
        }
      } catch (error: any) {
        console.error('Erreur lors du chargement du produit:', error)
        if (isMounted) {
          setError(error.message || 'Une erreur est survenue')
          setIsLoading(false)
        }
      }
    }

    fetchProduct()
    
    return () => {
      isMounted = false
    }
  }, [id, user?.email])

  useEffect(() => {
    if (showUploadIpfsForm) {
      fetchCollections()
    }
  }, [id, showUploadIpfsForm])

  const viewCertificate = () => {
    if (certificate && certificate.fileUrl) {
      window.open(certificate.fileUrl, '_blank')
    }
  }

  const checkUserRoyaltyRole = async (address: string) => {
    const network = getNetwork()
    const artistRoyaltiesAddress = await getSmartContractAddress('Royalties', network as NetworkType) as Address
    const hasRole = await checkRoyaltyRole(
      address,
      artistRoyaltiesAddress
    )
    if (hasRole) {
      setRoyaltiesManager(address as Address)
    }
    setHasRoyaltyRole(hasRole)
  }

  useEffect(() => {
    const checkInitialMinterStatus = async () => {
      console.log('Vérification initiale du statut minter - primaryWallet:', {
        primaryWalletAddress: primaryWallet?.address,
        nftResource: nftResource?.collection?.contractAddress
      })

      if (
        primaryWallet?.connector?.name === 'Rabby' && 
        primaryWallet?.address && 
        nftResource?.collection?.contractAddress
      ) {
        console.log('Adresse Rabby détectée:', primaryWallet.address)
        await checkUserRoyaltyRole(primaryWallet.address)
      }
    }

    checkInitialMinterStatus()
  }, [primaryWallet?.address, nftResource])

  useEffect(() => {
    const total = royalties.reduce((sum, royalty) => {
      const percentage = parseFloat(royalty.percentage) || 0
      return sum + percentage
    }, 0)
    setTotalPercentageBeneficiaries(total)

    
    const allAddressesValid = royalties.every(royalty => 
      royalty.address === '' || isValidEthereumAddress(royalty.address)
    )
    const isRoyaltySettingOk = 
      (total === 100) 
      && allAddressesValid
      && (totalPercentage > 0 && total <= 100)

    setAllBeneficaryAddress(allAddressesValid)
    // console.log('allAddressesValid : ', allAddressesValid)
    // console.log('isRoyaltySettingOk : ', isRoyaltySettingOk)

    setRoyaltiesSettingsOk(isRoyaltySettingOk)
    // console.log(royalties)
  }, [royalties, totalPercentage])
  
  const addRoyaltyRow = () => {
    setRoyalties([...royalties, { address: '', percentage: '' }])
  }
  
  const removeRoyaltyRow = (index: number) => {
    const updatedRoyalties = [...royalties]
    updatedRoyalties.splice(index, 1)
    setRoyalties(updatedRoyalties)
  }
  
  const handleRoyaltyChange = (index: number, field: 'address' | 'percentage', value: string) => {
    const updatedRoyalties = [...royalties]
    updatedRoyalties[index][field] = value
    setRoyalties(updatedRoyalties)
  }
  
  const checkRoyaltyRole = async (userAddress: string, contractAddress: string) => {
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
  
  useEffect(() => {
    checkUserRoyaltyRole(primaryWallet?.address as string)
  }, [primaryWallet?.address, nftResource])

  const handleConfigureRoyalties = async () => {
    
    try {
      const addresses = royalties.map(r => r.address as Address)
      if (addresses.some(addr => !isValidEthereumAddress(addr))) {
        toast.error('Certaines adresses ne sont pas valides')
        return
      }
      
      const percentages = royalties.map(r => {
        const value = parseFloat(r.percentage)
        if (isNaN(value)) {
          throw new Error('Certains pourcentages ne sont pas des nombres valides')
        }
        return value
      })
      
      if (isNaN(totalPercentage) || totalPercentage <= 0 || totalPercentage > 100) {
        toast.error('Le pourcentage total doit être entre 1 et 100')
        return
      }
      
      if (addresses.length !== percentages.length) {
        toast.error('Le nombre d\'adresses et de pourcentages ne correspond pas')
        return
      }
      
      console.log('nftResource:', nftResource)
      console.log('nftResource address:', nftResource.collection.contractAddress)
      console.log('nftResource tokenId:', nftResource.tokenId)
      console.log('addresses:', addresses)
      console.log('percentages:', percentages)
      console.log('totalPercentage:', totalPercentage*100)
      
      const args = [
        nftResource.collection.contractAddress, 
        nftResource.tokenId, 
        addresses, 
        percentages.map(p => Math.round(p)),
        Math.round(totalPercentage*InRealArtSmartContractConstants.PERCENTAGE_PRECISION)
      ]
      
      try {
        const result = await configureRoyalties({
          nftResource: {
            id: nftResource.id,
            collection: {
              contractAddress: nftResource.collection.contractAddress as Address
            },
            smartContract: {
              royaltiesAddress: nftResource.collection.smartContract.royaltiesAddress as Address
            },
            tokenId: nftResource.tokenId
          },
          recipients: addresses,
          percentages: percentages.map(p => Math.round(p)),
          totalPercentage: Math.round(totalPercentage),
          publicClient,
          walletClient: walletClient as WalletClient,
          royaltiesManager: royaltiesManager as Address,
          onSuccess: () => {
            console.log('Royalties configurées avec succès')
            router.refresh()
          }
        })
        
        if (result) {
          // Actions supplémentaires après succès
        }
      } catch (error: any) {
        console.error('Erreur lors de la simulation ou exécution:', error.message)
        toast.error(`Erreur: ${error.message}`)
      }
    } catch (error: any) {
      console.error('Erreur générale:', error)
      toast.error(`Erreur: ${error.message}`)
    } finally {
      
    }
  }

  return (
    <>
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>Détails du NFT</h1>
        
        {isLoading ? (
          <LoadingSpinner message="Chargement du produit..." />
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : (
          <div className={styles.productView}>
            <div className={styles.productGrid}>
              <div className={styles.imageSection}>
                {product?.imageUrl ? (
                  <div className={styles.imageContainer}>
                    <img src={product.imageUrl} alt={product.title} className={styles.productImage} />
                  </div>
                ) : (
                  <div className={styles.noImage}>Aucune image disponible</div>
                )}
              </div>
              
              <div className={styles.detailsSection}>
                <div className={styles.productInfo}>
                  <h2 className={styles.productTitle}>
                    {product.title}
                    {nftResource && (
                      <NftStatusBadge status={nftResource.status} className={styles.titleBadge} />
                    )}
                  </h2>
                  
                  {productOwner && (
                    <div className={styles.infoGroup}>
                      <span className={styles.label}>Propriétaire:</span>
                      <span className={styles.value}>
                        {productOwner.firstName} {productOwner.lastName}
                      </span>
                    </div>
                  )}
                  
                  <div className={styles.infoGroup}>
                    <span className={styles.label}>Prix:</span>
                    <span className={styles.value}>{product.price} {product.currency}</span>
                  </div>
                  
                  {certificate && (
                    <div className={styles.certificateSection}>
                      <span className={styles.label}>Certificat d'authenticité:</span>
                      <Button 
                        type="button" 
                        variant="secondary"
                        onClick={viewCertificate}
                        className={styles.certificateButton}
                      >
                        Voir le certificat
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className={styles.productDescription}>
                  <h3 className={styles.sectionTitle}>Description</h3>
                  <div 
                    className={styles.description}
                    dangerouslySetInnerHTML={{ __html: product.description || 'Aucune description disponible' }}
                  />
                </div>
                
                <div className={styles.nftResourceInfo}>
                  <h3 className={styles.formTitle}>Ressources NFT uploadées sur IPFS</h3>
                  <p className={styles.infoNote}>
                    Pour l'instant, le NFT de l'oeuvre n'est toujours pas mintée ...
                  </p>
                  
                  <div className={styles.formGroup}>
                    <label>Nom du NFT</label>
                    <input
                      type="text"
                      value={nftResource.name || ''}
                      readOnly
                      className={styles.formInput}
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>Description du NFT</label>
                    <textarea
                      value={nftResource.description || ''}
                      readOnly
                      className={styles.formTextarea}
                      rows={4}
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label>Collection</label>
                    <input
                      type="text"
                      value={collections.find(c => c.id === nftResource.collectionId)?.name || 'Collection inconnue'}
                      readOnly
                      className={styles.formInput}
                    />
                  </div>
                  
                  <IpfsUriField label="Image URI (IPFS)" uri={nftResource.imageUri} />
                  
                  <IpfsUriField label="Certificat URI (IPFS)" uri={nftResource.certificateUri} />
                  
                  <IpfsUriField label="Métadonnées URI (IPFS)" uri={nftResource.tokenUri} />
                  
                  <div className={styles.royaltiesConfig}>
                    <div className={styles.sectionTitleContainer}>
                      <h3 className={styles.sectionTitle}>Configuration des royalties</h3>
                      {nftResource?.collection?.smartContract?.royaltiesAddress && (
                        <a 
                          href={getBlockExplorerUrl(
                            nftResource.collection.smartContract.network || 'sepolia', 
                            nftResource.collection.smartContract.royaltiesAddress
                          )} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className={styles.contractAddressBadge}
                        >
                          <span className={styles.contractLabel}>Smart Contract de Royalties:</span>
                          {`${nftResource.collection.smartContract.royaltiesAddress.substring(0, 6)}...${nftResource.collection.smartContract.royaltiesAddress.substring(38)}`}
                        </a>
                      )}
                    </div>
                    <p className={styles.infoNote}>
                      Définissez les bénéficiaires des royalties et leur pourcentage respectif
                    </p>
                    
                    <div className={styles.royaltiesTable}>
                      <div className={styles.tableHeader}>
                        <div className={styles.tableHeaderCell}>Adresse</div>
                        <div className={styles.tableHeaderCell}>Pourcentage (%)</div>
                        <div className={styles.tableHeaderCell}></div>
                      </div>
                      
                      {royalties.map((royalty, index) => (
                        <div key={index} className={styles.tableRow}>
                          <div className={styles.tableCell}>
                            <input
                              type="text"
                              placeholder="0x..."
                              value={royalty.address}
                              onChange={(e) => handleRoyaltyChange(index, 'address', e.target.value)}
                              className={styles.formInput}
                            />
                          </div>
                          <div className={styles.tableCell}>
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              placeholder="0.0"
                              value={royalty.percentage}
                              onChange={(e) => handleRoyaltyChange(index, 'percentage', e.target.value)}
                              className={`${styles.formInput} ${styles.numberInput}`}
                            />
                          </div>
                          <div className={styles.tableCell}>
                            <button 
                              type="button" 
                              onClick={() => removeRoyaltyRow(index)}
                              className={styles.removeButton}
                            >
                              Supprimer
                            </button>
                          </div>
                        </div>
                      ))}
                      
                      <div className={styles.tableActions}>
                        <button 
                          type="button" 
                          onClick={addRoyaltyRow}
                          className={styles.addButton}
                        >
                          + Ajouter un bénéficiaire
                        </button>
                        {totalPercentageBeneficiaries !== 100 && (
                          <div className={styles.errorMessage}>
                            Le total des pourcentages doit être exactement 100% (actuellement: {totalPercentageBeneficiaries.toFixed(1)}%)
                          </div>
                        )}<br></br>
                        {!allBeneficaryAddress && (
                          <div className={styles.errorMessage}>
                            Une des adresses est invalide
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className={styles.totalPercentage}>
                      <span className={styles.label}>Pourcentage total aux bénéficiaires :</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        placeholder="0.0"
                        value={totalPercentage}
                        onChange={(e) => setTotalPercentage(parseFloat(e.target.value) || 0)}
                        className={`${styles.formInput} ${styles.numberInput} ${totalPercentage === 0 || totalPercentage > 100 ? styles.error : ''}`}
                      />
                      <span>%</span>
                      {totalPercentage === 0 || totalPercentage > 100 && (
                        <span className={styles.errorMessage}>
                          Le pourcentage total ne peut pas dépasser 100%
                        </span>
                      )}
                    </div>
                    
                    <div className={styles.actionButtons}>
                      <Button 
                        type="button" 
                        variant="secondary"
                        onClick={() => router.back()}
                      >
                        Annuler
                      </Button>
                      <Button 
                        type="button" 
                        variant="primary"
                        onClick={handleConfigureRoyalties}
                        disabled={
                          isConfiguring || 
                          totalPercentageBeneficiaries !== 100 || 
                          royalties.length === 0 || 
                          !hasRoyaltyRole ||
                          !royaltiesSettingsOk ||
                          isCheckingRole
                        }
                      >
                        {isConfiguring 
                          ? 'Configuration en cours...' 
                          : isCheckingRole 
                            ? 'Vérification des droits...'
                            : !hasRoyaltyRole 
                              ? 'Vous n\'avez pas les droits pour configurer les royalties'
                              : !royaltiesSettingsOk
                                ? `Mauvaise configuration des royalties`
                                : 'Configurer les royalties pour le NFT'}
                      </Button>
                    </div>
                  </div>
                  
                </div>                
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
} 