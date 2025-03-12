'use client'

import { useState, useEffect, Usable } from 'react'
import { useRouter } from 'next/navigation'
import { useDynamicContext, useWalletConnectorEvent } from '@dynamic-labs/sdk-react-core'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import Button from '@/app/components/Button/Button'
import { getShopifyProductById } from '@/app/actions/shopify/shopifyActions'
import { getAuthCertificateByItemId, getItemByShopifyId, getUserByItemId, getAllCollections, createNftResource, getNftResourceByItemId, getActiveCollections, checkNftResourceNameExists, updateNftResourceTxHash, updateNftResourceStatusToMinted } from '@/app/actions/prisma/prismaActions'
import { Toaster } from 'react-hot-toast'
import styles from './nftToMint.module.scss'
import React from 'react'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import { uploadFilesToIpfs, uploadMetadataToIpfs } from '@/app/actions/pinata/pinataActions'
import { useAccount, useWalletClient } from 'wagmi'
import { publicClient } from '@/lib/providers'
import { Address } from 'viem'
import { artistNftCollectionAbi } from '@/lib/contracts/ArtistNftCollectionAbi'
import { useNftMinting } from '../../../hooks/useNftMinting'
import NftStatusBadge from '@/app/components/Nft/NftStatusBadge'


type ParamsType = { id: string }

export default function ViewProductPage({ params }: { params: ParamsType }) {
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

  //---------------------------------------------------------------- verifyMinter
  const verifyMinter = async (address: string) => { 
      const collectionAddress = nftResource.collection.contractAddress
      const result = await checkIsMinter(collectionAddress, address)
      if (result) {
        setMinterWallet(address as Address)
      }
      setIsMinter(result)
  }

  //---------------------------------------------------------------- handleUploadOnIpfs
  const handleUploadOnIpfs = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormErrors({})
    
    try {
      // Valider les fichiers avec Zod
      const result = ipfsFormSchema.safeParse({
        name: formData.name,
        description: formData.description,
        collection: formData.collection,
        image: formData.image,
        certificate: formData.certificate
      })
      
      if (!result.success) {
        // Transformer les erreurs Zod en objet d'erreurs
        const errors: Record<string, string> = {}
        result.error.issues.forEach(issue => {
          errors[issue.path[0].toString()] = issue.message
        })
        setFormErrors(errors)
        // Afficher un toast d'erreur
        toast.error('Veuillez corriger les erreurs du formulaire')
        return
      }
      
      // Vérifier l'unicité du nom NFT
      const nameCheckToast = toast.loading('Vérification du nom du NFT...')
      const nameExists = await checkNftResourceNameExists(formData.name)
      toast.dismiss(nameCheckToast)
      
      if (nameExists) {
        setFormErrors(prev => ({
          ...prev,
          name: 'Ce nom de NFT existe déjà. Veuillez en choisir un autre.'
        }))
        toast.error('Ce nom de NFT existe déjà')
        return
      }
      
      // Afficher un toast de chargement
      const loadingToast = toast.loading('Upload des fichiers sur IPFS en cours...')
      
      // Appel du server action pour upload les fichiers
      const response = await uploadFilesToIpfs(
        formData.image as File,
        formData.certificate as File,
        formData.name || product.title || 'nft'
      )
      
      // Fermer le toast de chargement
      toast.dismiss(loadingToast)
      
      if (!response.success) {
        toast.error(response.error || 'Erreur lors de l\'upload sur IPFS')
        return
      }
      
      console.log('Image uploadée sur IPFS:', response.image)
      console.log('Certificat uploadé sur IPFS:', response.certificate)
      
      // Upload des métadonnées sur IPFS via la Server Action
      const metadataToast = toast.loading('Upload des métadonnées NFT sur IPFS...');
      
      try {
        const metadataResponse = await uploadMetadataToIpfs({
          name: formData.name,
          description: formData.description,
          imageCID: response.image.data.cid,
          certificateUri: `ipfs://${response.certificate.data.cid}`,
          externalUrl: `${process.env.NEXT_PUBLIC_WEBSITE_URL}/artwork/${product.handle}`
        });
        
        if (!metadataResponse.success) {
          toast.dismiss(metadataToast);
          toast.error(metadataResponse.error || 'Erreur lors de l\'upload des métadonnées');
          return;
        }
        
        const tokenUri = metadataResponse.metadata?.data.cid;
        console.log('Métadonnées uploadées sur IPFS:', tokenUri);
        toast.dismiss(metadataToast);
        
        // Création d'un enregistrement dans la table NftResource
        const nftResourceToast = toast.loading('Enregistrement des ressources NFT...')
        
        try {
          if (!item || !item.id) {
            throw new Error('Impossible de trouver l\'item associé')
          }

          const collectionId = parseInt(formData.collection)
          if (isNaN(collectionId)) {
            throw new Error('ID de collection invalide')
          }
          
          // Appel à l'action serveur pour créer l'enregistrement NftResource
          const nftResourceResult = await createNftResource({
            itemId: item.id,
            imageUri: response.image.data.cid,
            certificateUri: response.certificate.data.cid,
            tokenUri: tokenUri, // Utiliser le CID retourné par Pinata
            type: 'IMAGE',
            status: 'UPLOADMETADATA', // Mettre à jour le statut
            name: formData.name,
            description: formData.description,
            collectionId: collectionId
          });
          
          toast.dismiss(nftResourceToast);
          
          if (!nftResourceResult.success) {
            toast.error(nftResourceResult.error || 'Erreur lors de l\'enregistrement des ressources NFT');
            return;
          }
          
          toast.success('Ressources NFT enregistrées avec succès');
          setShowUploadIpfsForm(false);
          
          // Rafraîchir la page pour afficher les changements
          router.refresh();
        } catch (resourceError) {
          toast.dismiss(nftResourceToast);
          console.error('Erreur lors de l\'enregistrement des ressources NFT:', resourceError);
          toast.error('Une erreur est survenue lors de l\'enregistrement des ressources NFT');
        }
      } catch (metadataError) {
        toast.dismiss(metadataToast);
        console.error('Erreur lors de l\'upload des métadonnées:', metadataError);
        toast.error('Une erreur est survenue lors de l\'upload des métadonnées');
      }
    } catch (error) {
      console.error('Erreur lors de l\'upload sur IPFS:', error);
      toast.error('Une erreur est survenue lors de l\'upload');
    }
  }

  // Fonction pour gérer l'action selon le statut de l'item
  const handleItemAction = async () => {
    if (item?.status === 'pending') {
      if (nftResource && nftResource.status === 'UPLOADMETADATA') {
        // Si les ressources sont déjà sur IPFS, passer à l'étape suivante (mint)
        console.log('Ressources déjà sur IPFS, prêt pour le mint')
        // Logique pour mint NFT
        console.log('Mint NFT pour le produit:', product.id)
        // Appel à l'API de mint
      } else {
        // Afficher le formulaire pour upload sur IPFS
        setShowUploadIpfsForm(true)
      }
    } else {
      // Logique pour mint NFT
      console.log('Mint NFT pour le produit:', product.id)
      // Appel à l'API de mint
    }
  }

  // Détermine le texte du bouton en fonction du statut de l'item et du nftResource
  const getActionButtonText = () => {
    if (item?.status === 'pending') {
      if (nftResource?.status === 'UPLOADIPFS') {
        return 'Mint NFT'
      }
      return 'Préparer pour le mint'
    }
    return 'Lister sur la marketplace'
  }

  // Nouvelle fonction pour vérifier si l'utilisateur est un minter
  const checkIsMinter = async (collectionAddress: string, userAddress: string) => {
    console.log('collectionAddress : ', collectionAddress)
    console.log('userAddress : ', userAddress)
    //if (!collectionAddress || !userAddress) return false
    
    setIsCheckingMinter(true)
    try {
      // Utiliser la fonction getMinters() pour récupérer la liste des minters
      const minters = await publicClient.readContract({
        address: collectionAddress as Address,
        abi: artistNftCollectionAbi,
        functionName: 'getMinters'
      }) as Address[]
      console.log('minters : ', minters)
      // Vérifier si l'adresse de l'utilisateur est dans la liste des minters
      const userIsMinter = minters.map(m => m.toLowerCase()).includes(userAddress.toLowerCase())
      console.log(`L'utilisateur ${userAddress} ${userIsMinter ? 'est' : 'n\'est pas'} un minter sur la collection ${collectionAddress}`)
      console.log('Liste des minters:', minters)
      
      return userIsMinter
    } catch (error) {
      console.error('Erreur lors de la vérification des minters:', error)
      return false
    } finally {
      setIsCheckingMinter(false)
    }
  }
  
  // useEffect(() => {
    
    
  //   verifyMinter()
  // }, [nftResource, address, isConnected])

  
  useWalletConnectorEvent(
    primaryWallet?.connector, 
    'accountChange',
    async ({ accounts }, connector) => {
      if (connector.name === 'Rabby') {
        console.log('Rabby wallet account changed:', accounts);
        // Handle Rabby wallet account change
        await verifyMinter(accounts[0]);
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
        await verifyMinter(address);
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
        await verifyMinter(primaryWallet.address)
      }
    }

    checkInitialMinterStatus()
  }, [primaryWallet?.address, nftResource]) // Changement des dépendances pour utiliser primaryWallet.address

  //---------------------------------------------------------------- handleMintNFT2
  const handleMintNFT2 = async (): Promise<void> => {
    if (!nftResource || !publicClient || !minterWallet) {
      toast.error('Données manquantes pour le minting')
      return
    }

    await mintNFT({
      nftResource,
      publicClient,
      walletClient: walletClient,
      minterWallet,
      onSuccess: () => {
        // Rafraîchir la page pour afficher les modifications
        router.refresh()
      }
    })
  }

  //---------------------------------------------------------------- handleMintNFT
  const handleMintNFT = async () => {
    const contractAddress = nftResource.collection.contractAddress as Address
    
    // Afficher un toast de chargement
    const mintingToast = toast.loading('Minting en cours...')
    
    try {
      // Préparer les paramètres NFT pour le smart contract
      const nftParams = {
        name: nftResource.name,
        description: nftResource.description,
        certificateAuthenticity: `ipfs://${nftResource.certificateUri}`,
        tags: [],
        permissions: [],
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
        account: minterWallet as Address
      })
      
      
      if (!walletClient) {
        throw new Error('Wallet client non disponible')
      }
      
      // Exécuter la transaction
      const hash = await walletClient?.writeContract(request)
      
      try {
        // Appel à une action serveur pour mettre à jour le txHash
        const updateResult = await updateNftResourceTxHash(nftResource.id, hash)
        
        if (updateResult.success) {
          toast.success('NFT minté en attente de confirmation ... ')
        } else {
          toast.error(`Erreur lors de la mise à jour du txHash de la resource NFT : ${updateResult.error}`)
        }
      } catch (updateError) {
        console.error('Erreur lors de la mise à jour du txHash:', updateError)
        toast.error('NFT minté, mais erreur lors de la mise à jour des informations')
      }
      
      toast.dismiss(mintingToast)
      toast.loading(`Transaction soumise. Hash: ${hash.slice(0, 10)}...`)
      
      // Attendre la confirmation de la transaction
      const receipt = await publicClient.waitForTransactionReceipt({ 
        hash: hash as Address,
        timeout: 120000 
      })
      
      // Vérifier si la transaction est réussie
      if (receipt.status === 'success') {
        toast.success('NFT minté avec succès!')
        
        // Appel à une action serveur pour mettre à jour le statut de la ressource NFT
        const updateResult = await updateNftResourceStatusToMinted(nftResource.id)

        // Rafraîchir la page pour afficher les modifications
        router.refresh()
      } else {
        toast.error('La transaction a échoué')
      }
    } catch (error) {
      console.error('Erreur lors du minting:', error)
      toast.dismiss(mintingToast)
      toast.error(`Erreur lors du minting: ${(error as Error).message}`)
    }
  }

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

  return (
    <>
      <Toaster position="top-center" />
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>Détails du produit</h1>
        
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
                
                {item?.status === 'pending' && nftResource?.status === 'UPLOADMETADATA' ? (
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
                        onClick={handleMintNFT2}
                        disabled={isCheckingMinter || !isMinter}
                      >
                        {isCheckingMinter 
                          ? 'Vérification des permissions...' 
                          : !isMinter 
                          ? 'Vous n\'êtes pas autorisé à minter' 
                          : 'Mint NFT'}
                      </Button>
                    </div>
                  </div>
                ) : showUploadIpfsForm && item?.status === 'pending' ? (
                  <div className={styles.listingFormContainer}>
                    <h3 className={styles.formTitle}>Upload sur IPFS</h3>
                    <form onSubmit={handleUploadOnIpfs} className={styles.listingForm}>
                      <div className={styles.formGroup}>
                        <label htmlFor="name">Nom du NFT</label>
                        <input
                          id="name"
                          name="name"
                          type="text"
                          value={formData.name}
                          onChange={handleFormChange}
                          required
                          className={styles.formInput}
                          placeholder="Nom du NFT"
                        />
                        {formErrors.name && (
                          <span className={styles.errorMessage}>{formErrors.name}</span>
                        )}
                      </div>
                      
                      <div className={styles.formGroup}>
                        <label htmlFor="description">Description du NFT</label>
                        <textarea
                          id="description"
                          name="description"
                          value={formData.description}
                          onChange={handleFormChange}
                          required
                          className={styles.formTextarea}
                          placeholder="Description du NFT"
                          rows={4}
                        />
                        {formErrors.description && (
                          <span className={styles.errorMessage}>{formErrors.description}</span>
                        )}
                      </div>
                      
                      <div className={styles.formGroup}>
                        <label htmlFor="collection">Collection</label>
                        <select
                          id="collection"
                          name="collection"
                          value={formData.collection}
                          onChange={handleFormChange}
                          required
                          className={styles.formSelect}
                        >
                          <option value="">Sélectionnez une collection</option>
                          {collections.map((collection) => (
                            <option key={collection.id} value={collection.id.toString()}>
                              {collection.name}
                            </option>
                          ))}
                        </select>
                        {formErrors.collection && (
                          <span className={styles.errorMessage}>{formErrors.collection}</span>
                        )}
                      </div>
                      
                      <div className={styles.formGroup}>
                        <label htmlFor="image">Image du NFT</label>
                        <input
                          id="image"
                          name="image"
                          type="file"
                          accept="image/*"
                          onChange={handleFormChange}
                          required
                          className={styles.formFileInput}
                        />
                        {formErrors.image && (
                          <span className={styles.errorMessage}>{formErrors.image}</span>
                        )}
                      </div>
                      
                      <div className={styles.formGroup}>
                        <label htmlFor="certificate">Certificat d'authenticité</label>
                        <input
                          id="certificate"
                          name="certificate"
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={handleFormChange}
                          required
                          className={styles.formFileInput}
                        />
                        {formErrors.certificate && (
                          <span className={styles.errorMessage}>{formErrors.certificate}</span>
                        )}
                      </div>
                      
                      <div className={styles.formActions}>
                        <Button 
                          type="button" 
                          variant="secondary"
                          onClick={() => setShowUploadIpfsForm(false)}
                        >
                          Annuler
                        </Button>
                        <Button 
                          type="submit" 
                          variant="primary"
                        >
                          Upload sur IPFS
                        </Button>
                      </div>
                    </form>
                  </div>
                ) : (
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
                      onClick={handleItemAction}
                    >
                      {getActionButtonText()}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
} 