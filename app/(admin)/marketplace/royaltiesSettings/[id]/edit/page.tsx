'use client'

import { useState, useEffect, Usable } from 'react'
import { useRouter } from 'next/navigation'
import { useDynamicContext, useWalletConnectorEvent } from '@dynamic-labs/sdk-react-core'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import Button from '@/app/components/Button/Button'
import { getShopifyProductById } from '@/app/actions/shopify/shopifyActions'
import { getAuthCertificateByItemId, getItemByShopifyId, getUserByItemId, getAllCollections, createNftResource, getNftResourceByItemId, getActiveCollections, checkNftResourceNameExists, updateNftResourceTxHash, updateNftResourceStatusToMinted } from '@/app/actions/prisma/prismaActions'
import { Toaster } from 'react-hot-toast'
import styles from './royaltySettings.module.scss'
import React from 'react'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import { uploadFilesToIpfs, uploadMetadataToIpfs } from '@/app/actions/pinata/pinataActions'
import { useAccount, useWalletClient } from 'wagmi'
import { publicClient } from '@/lib/providers'
import { Address, encodeFunctionData, isAddress } from 'viem'
import { artistNftCollectionAbi } from '@/lib/contracts/ArtistNftCollectionAbi'
import { useNftMinting } from '../../../hooks/useNftMinting'
import NftStatusBadge from '@/app/components/Nft/NftStatusBadge'
import { InRealArtRoles } from '@/lib/blockchain/smartContractConstants'
import { artistRoyaltiesAbi } from '@/lib/contracts/ArtistRoyalties'
import { CONTRACT_ADDRESSES, ContractName } from '@/constants/contracts'
import { getNetwork } from '@/lib/blockchain/networkConfig'
import { isValidEthereumAddress } from '@/lib/blockchain/utils'

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
  const [minterWallet, setMinterWallet] = useState<Address | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    collection: '',
    image: null as File | null,
    certificate: null as File | null,
    intellectualProperty: false
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [isMinter, setIsMinter] = useState<boolean>(false)
  const [isCheckingMinter, setIsCheckingMinter] = useState<boolean>(false)
  // Récupérer le walletClient pour les transactions
  const { data: walletClient } = useWalletClient()
  const [hasRoyaltyRole, setHasRoyaltyRole] = useState<boolean>(false)
  const [isCheckingRole, setIsCheckingRole] = useState<boolean>(false)

  const unwrappedParams = React.use(params as any) as ParamsType
  const id = unwrappedParams.id
  const { mintNFT, isLoading: isMinting, error: mintingError, success: mintingSuccess } = useNftMinting()
  
  // Schéma de validation Zod pour les fichiers IPFS
  const ipfsFormSchema = z.object({
    name: z.string().min(1, "Le nom du NFT est obligatoire"),
    description: z.string().min(1, "La description du NFT est obligatoire"),
    collection: z.string().min(1, "La sélection d'une collection est obligatoire"),
    image: z.instanceof(File, { 
      message: "L'image du NFT est obligatoire" 
    }),
    certificate: z.instanceof(File, { 
      message: "Le certificat d'authenticité est obligatoire" 
    })
  })

  // État pour gérer les royalties
  const [royalties, setRoyalties] = useState<Array<{address: string, percentage: string}>>([
    { address: '', percentage: '' }
  ])
  const [totalPercentage, setTotalPercentage] = useState<number>(0)
  const [totalPercentageBeneficiaries, setTotalPercentageBeneficiaries] = useState<number>(0)
  const [allBeneficaryAddress, setAllBeneficaryAddress] = useState<boolean>(false)
  const [isConfiguring, setIsConfiguring] = useState<boolean>(false)
  const [royaltiesSettingsOk, setRoyaltiesSettingsOk] = useState<boolean>(false)


  const fetchCollections = async () => {
    try {
      const collectionsData = await getActiveCollections()
      //console.log('Collections Data:', collectionsData)
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
        // Handle Rabby wallet account change
        await checkUserRoyaltyRole(accounts[0]);
      }
    }
  );

  // CORRECTION: Utilisation correcte de useWalletConnectorEvent pour les changements de chaîne
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
  
  // Ajout d'un useEffect pour la vérification initiale du minter
 // Remplacer l'useEffect à la ligne 469 par celui-ci
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
  }, [primaryWallet?.address, nftResource]) // Changement des dépendances pour utiliser primaryWallet.address


  useEffect(() => {
    if (!user?.email) {
      setError('Vous devez être connecté pour visualiser ce produit')
      setIsLoading(false)
      return
    }

    let isMounted = true
    
    const fetchProduct = async () => {
      try {
        // Extraire l'ID numérique si l'ID est au format GID
        const productId = params.id.includes('gid://shopify/Product/') 
          ? params.id.split('/').pop() 
          : params.id
        
        const result = await getShopifyProductById(productId as string)
        //console.log('Shopify Product:', result)
        if (isMounted) {
          if (result.success && result.product) {
            setProduct(result.product)
            
            // Convertir result.product.id en nombre
            const shopifyProductId = typeof result.product.id === 'string' 
              ? BigInt(result.product.id.replace('gid://shopify/Product/', ''))
              : BigInt(result.product.id)

            // Rechercher l'Item associé 
            const itemResult = await getItemByShopifyId(shopifyProductId)
            //console.log('Item Result:', itemResult)
            if (itemResult?.id) {
              setItem(itemResult)
              try {
                // Récupérer le certificat d'authenticité
                const certificateResult = await getAuthCertificateByItemId(itemResult.id)
                if (certificateResult && certificateResult.id) {
                  setCertificate(certificateResult)
                }
                
                // Récupérer l'utilisateur associé à cet item
                const ownerResult = await getUserByItemId(itemResult.id)
                if (ownerResult) {
                  setProductOwner(ownerResult)
                }
                
                // Récupérer le nftResource associé à cet item
                console.log('itemResult : ', itemResult)
                const nftResourceResult = await getNftResourceByItemId(itemResult.id)
                fetchCollections()
                //console.log('NftResource Result:', nftResourceResult)
                if (nftResourceResult) {
                  setNftResource(nftResourceResult)
                  // Pré-remplir le formulaire avec les données existantes
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

  // Fonction pour charger les collections
  useEffect(() => {
    if (showUploadIpfsForm) {
      fetchCollections()
    }
  }, [id, showUploadIpfsForm])

  // Fonction pour ouvrir le certificat dans un nouvel onglet
  const viewCertificate = () => {
    if (certificate && certificate.fileUrl) {
      window.open(certificate.fileUrl, '_blank')
    }
  }

  // Fonction pour gérer les changements de valeurs dans le formulaire
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement
    
    if (type === 'checkbox') {
      setFormData(prev => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked
      }))
    } else if (type === 'file') {
      const files = (e.target as HTMLInputElement).files
      if (files && files.length > 0) {
        setFormData(prev => ({
          ...prev,
          [name]: files[0]
        }))
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const checkUserRoyaltyRole = async (address: string) => {
    const network = getNetwork()
    //console.log('Royalties SC : ', CONTRACT_ADDRESSES[network.id][ContractName.NFT_ROYALTIES])
    const hasRole = await checkRoyaltyRole(
      address,
      CONTRACT_ADDRESSES[network.id][ContractName.NFT_ROYALTIES]
    )
    setHasRoyaltyRole(hasRole)
  }

  // Ajout d'un useEffect pour la vérification initiale du minter
 // Remplacer l'useEffect à la ligne 469 par celui-ci
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
  }, [primaryWallet?.address, nftResource]) // Changement des dépendances pour utiliser primaryWallet.address

  // Composant pour afficher un champ d'URI IPFS avec lien de visualisation
  function IpfsUriField({ label, uri, prefix = 'ipfs://' }: { label: string, uri: string, prefix?: string } ) {
    return (
      <div className={styles.formGroup}>
        <label>{label}</label>
        <div className={styles.ipfsLinkContainer}>
          <input
            type="text"
            value={`${prefix}${uri}`}
            readOnly
            className={styles.formInput}
          />
          <a 
            href={`https://gateway.pinata.cloud/ipfs/${uri}`} 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.viewLink}
          >
            Voir
          </a>
        </div>
      </div>
    )
  }

  // Calcul automatique du pourcentage total à chaque modification des royalties
  useEffect(() => {
    const total = royalties.reduce((sum, royalty) => {
      const percentage = parseFloat(royalty.percentage) || 0
      return sum + percentage
    }, 0)
    setTotalPercentageBeneficiaries(total)

    
    // Vérifier que toutes les adresses renseignées sont valides
    const allAddressesValid = royalties.every(royalty => 
      royalty.address === '' || isValidEthereumAddress(royalty.address)
    )
    const isRoyaltySettingOk = 
      (total === 100) 
      && allAddressesValid
      && (totalPercentage > 0 && total <= 100)

    setAllBeneficaryAddress(allAddressesValid)
    console.log('allAddressesValid : ', allAddressesValid)
    console.log('isRoyaltySettingOk : ', isRoyaltySettingOk)

    setRoyaltiesSettingsOk(isRoyaltySettingOk)
    console.log(royalties)
  }, [royalties, totalPercentage])
  
  // Fonction pour ajouter une nouvelle ligne de royalty
  const addRoyaltyRow = () => {
    setRoyalties([...royalties, { address: '', percentage: '' }])
  }
  
  // Fonction pour supprimer une ligne de royalty
  const removeRoyaltyRow = (index: number) => {
    const updatedRoyalties = [...royalties]
    updatedRoyalties.splice(index, 1)
    setRoyalties(updatedRoyalties)
  }
  
  // Fonction pour mettre à jour les valeurs de royalty
  const handleRoyaltyChange = (index: number, field: 'address' | 'percentage', value: string) => {
    const updatedRoyalties = [...royalties]
    updatedRoyalties[index][field] = value
    setRoyalties(updatedRoyalties)
  }
  
  // Vérification du rôle de l'utilisateur
  const checkRoyaltyRole = async (userAddress: string, contractAddress: string) => {
    if (!userAddress || !contractAddress) return false
    
    setIsCheckingRole(true)
    try {
      
      // Vérifier si l'utilisateur a le rôle DEFAULT_ADMIN_ROLE
      const hasAdminRole = await publicClient.readContract({
        address: contractAddress as Address,
        abi: artistRoyaltiesAbi,
        functionName: 'hasRole',
        args: [InRealArtRoles.DEFAULT_ADMIN_ROLE, userAddress as Address]
      }) as boolean
      
      // Vérifier si l'utilisateur a le rôle ADMIN_ROYALTIES_ROLE
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
  
  // Effet pour vérifier le rôle de l'utilisateur
  useEffect(() => {
    checkUserRoyaltyRole(primaryWallet?.address as string)
  }, [primaryWallet?.address, nftResource])


  // Fonction pour configurer les royalties sur la blockchain
  const handleConfigureRoyalties = async () => {
    setIsConfiguring(true)
    const toastId = toast.loading('Configuration des royalties en cours...')
    
    try {
      // Vérifier que les adresses sont valides
      const addresses = royalties.map(r => r.address as Address)
      if (addresses.some(addr => !isValidEthereumAddress(addr))) {
        toast.error('Certaines adresses ne sont pas valides', { id: toastId })
        setIsConfiguring(false)
        return
      }
      
      // Vérifier que les pourcentages sont valides
      const percentages = royalties.map(r => {
        const value = parseFloat(r.percentage)
        if (isNaN(value)) {
          throw new Error('Certains pourcentages ne sont pas des nombres valides')
        }
        return value
      })
      
      // Vérifier que le pourcentage total est valide
      if (isNaN(totalPercentage) || totalPercentage <= 0 || totalPercentage > 100) {
        toast.error('Le pourcentage total doit être entre 1 et 100', { id: toastId })
        setIsConfiguring(false)
        return
      }
      
      // Vérifier que les tableaux ont la même longueur
      if (addresses.length !== percentages.length) {
        toast.error('Le nombre d\'adresses et de pourcentages ne correspond pas', { id: toastId })
        setIsConfiguring(false)
        return
      }
      
      console.log('nftResource:', nftResource)
      console.log('nftResource address:', nftResource.collection.contractAddress)
      console.log('nftResource tokenId:', nftResource.tokenId)
      console.log('addresses:', addresses)
      console.log('percentages:', percentages)
      console.log('totalPercentage:', totalPercentage*100)
      
      // Convertir les pourcentages en entiers si nécessaire
      // Certains contrats attendent des points de base (1% = 100 points)
      const args = [
        nftResource.collection.contractAddress, 
        nftResource.tokenId, 
        addresses, 
        percentages.map(p => Math.round(p)), // Convertir en entiers
        Math.round(totalPercentage*100) // Convertir en entier
      ]
      
      try {
        const network = getNetwork()
        const royaltiesContractAddress = CONTRACT_ADDRESSES[network.id][ContractName.NFT_ROYALTIES]
        console.log('royaltiesContractAddress:', royaltiesContractAddress)
        // Simuler la transaction pour détecter les erreurs
        const { request } = await publicClient.simulateContract({
          address: royaltiesContractAddress as Address,
          abi: artistRoyaltiesAbi,
          functionName: 'setRoyalty',
          args: args,
          account: primaryWallet?.address as Address
        })
        
        if (!walletClient) {
          throw new Error('Wallet client non disponible')
        }
        
        // Exécuter la transaction
        const hash = await walletClient.writeContract(request)
        
        toast.success('Transaction soumise avec succès', { id: toastId })
        toast.loading(`Transaction en cours de traitement: ${hash.slice(0, 10)}...`)
        
        // Attendre la confirmation de la transaction
        const receipt = await publicClient.waitForTransactionReceipt({ 
          hash,
          timeout: 120000 
        })
        
        // Vérifier si la transaction est réussie
        if (receipt.status === 'success') {
          toast.success('Royalties configurées avec succès!')
          
          // Rafraîchir la page
          router.refresh()
        } else {
          toast.error('La transaction a échoué')
        }
      } catch (error: any) {
        console.error('Erreur lors de la simulation ou exécution:', error)
        
        // Essayer de donner des conseils spécifiques basés sur l'erreur
        if (error.message.includes('insufficient funds')) {
          toast.error('Fonds insuffisants pour exécuter la transaction', { id: toastId, duration: 5000 })
        } else if (error.message.includes('gas required exceeds allowance')) {
          toast.error('La limite de gaz est trop basse pour cette transaction', { id: toastId, duration: 5000 })
        }
      }
    } catch (error: any) {
      console.error('Erreur générale:', error)
      toast.error(`Erreur: ${error.message}`, { id: toastId })
    } finally {
      setIsConfiguring(false)
    }
  }

  return (
    <>
      <Toaster position="top-center" />
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
                  
                  {/* Formulaire de configuration des royalties */}
                  <div className={styles.royaltiesConfig}>
                    <h3 className={styles.sectionTitle}>Configuration des royalties</h3>
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