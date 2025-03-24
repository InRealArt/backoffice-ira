'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDynamicContext, useWalletConnectorEvent } from '@dynamic-labs/sdk-react-core'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { getShopifyProductById } from '@/app/actions/shopify/shopifyActions'
import { getAuthCertificateByItemId, getItemByShopifyId, getUserByItemId, createNftResource, getNftResourceByItemId, getActiveCollections, checkNftResourceNameExists, isCertificateUriUnique, getItemById } from '@/app/actions/prisma/prismaActions'
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
import IpfsUriField from '@/app/components/Marketplace/IpfsUriField'
import Image from 'next/image'

type ParamsType = { id: string }

export default function ViewNftToMintPage({ params }: { params: ParamsType }) {
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
        const productId = id.includes('gid://shopify/Product/') 
          ? id.split('/').pop() 
          : id
        
        const result = await getShopifyProductById(id)
        if (isMounted) {
          if (result.success && result.product) {
            setProduct(result.product)
            
            // Convertir result.product.id en nombre
            const shopifyProductId = typeof result.product.id === 'string' 
              ? BigInt(result.product.id.replace('gid://shopify/Product/', ''))
              : BigInt(result.product.id)

            // Rechercher l'Item associé 
            const itemResult = await getItemByShopifyId(shopifyProductId)
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
                const nftResourceResult = await getNftResourceByItemId(itemResult.id)
                fetchCollections()
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
      const collectionAddress = nftResource?.collection?.contractAddress
      if (!collectionAddress) return false
      
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
      
      if (await isCertificateUriUnique(response.certificate.data.cid)) {
        toast.error('Le certificat d\'authenticité existe déjà sur IPFS')
        return
      }
      
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
          
          // Rediriger vers la liste des NFTs à minter
          router.push('/marketplace/nftsToMint');
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

  // Nouvelle fonction pour vérifier si l'utilisateur est un minter
  const checkIsMinter = async (collectionAddress: string, userAddress: string) => {
    if (!collectionAddress || !userAddress) return false
    
    setIsCheckingMinter(true)
    try {
      // Utiliser la fonction getMinters() pour récupérer la liste des minters
      const minters = await publicClient.readContract({
        address: collectionAddress as Address,
        abi: artistNftCollectionAbi,
        functionName: 'getMinters'
      }) as Address[]
      
      // Vérifier si l'adresse de l'utilisateur est dans la liste des minters
      const userIsMinter = minters.map(m => m.toLowerCase()).includes(userAddress.toLowerCase())
      
      return userIsMinter
    } catch (error) {
      console.error('Erreur lors de la vérification des minters:', error)
      return false
    } finally {
      setIsCheckingMinter(false)
    }
  }
  
  useWalletConnectorEvent(
    primaryWallet?.connector, 
    'accountChange',
    async ({ accounts }, connector) => {
      if (connector.name === 'Rabby') {
        await verifyMinter(accounts[0]);
      }
    }
  );

  useWalletConnectorEvent(
    primaryWallet?.connector,
    'chainChange',
    async ({ chain }, connector) => {
      if (address) {
        await verifyMinter(address);
      }
    }
  );
  
  // Ajout d'un useEffect pour la vérification initiale du minter
  useEffect(() => {
    const checkInitialMinterStatus = async () => {
      if (
        primaryWallet?.connector?.name === 'Rabby' && 
        primaryWallet?.address && 
        nftResource?.collection?.contractAddress
      ) {
        await verifyMinter(primaryWallet.address)
      }
    }

    checkInitialMinterStatus()
  }, [primaryWallet?.address, nftResource])

  //---------------------------------------------------------------- handleMintNFT
  const handleMintNFT = async (): Promise<void> => {
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

  const handleCancel = () => {
    router.push('/marketplace/nftsToMint')
  }

  if (isLoading) {
    return (
      <div className="page-container">
        <div className="d-flex justify-content-center align-items-center p-xl">
          <LoadingSpinner size="large" message="Chargement des données ..." />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="alert alert-danger">
          <strong>Erreur:</strong> {error}
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">Détails de l'œuvre à minter</h1>
          {nftResource && <NftStatusBadge status={nftResource.status} />}
        </div>
      </div>

      {/* Informations sur l'œuvre */}
      <div className="edit-form-container">
        <div className="edit-form">
          {/* Titre de l'œuvre */}
          <div className="form-group">
            <label className="form-label">Titre</label>
            <div className="form-readonly">{product?.title || "Non défini"}</div>
          </div>
          
          {/* Image de l'œuvre */}
          <div className="form-group">
            <label className="form-label">Image</label>
            <div className="form-readonly" style={{ height: "240px", display: "flex", justifyContent: "center", alignItems: "center" }}>
              {product && product.imageUrl ? (
                <img 
                  src={product.imageUrl} 
                  alt={product.title} 
                  style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} 
                />
              ) : (
                <span className="text-muted">Aucune image disponible</span>
              )}
            </div>
          </div>

          

          {/* Prix */}
          <div className="form-group">
            <label className="form-label">Prix</label>
            <div className="form-readonly">
              {product?.variants && product.variants[0] ? 
                `${product.variants[0].price} ${product.variants[0].currency || "EUR"}` : 
                "Non défini"}
            </div>
          </div>

          {/* ID Shopify */}
          <div className="form-group">
            <label className="form-label">ID Shopify</label>
            <div className="form-readonly">
              {typeof product?.id === 'string' ? 
                product.id.replace('gid://shopify/Product/', '') : 
                product?.id || "Non défini"}
            </div>
          </div>

          {/* Propriétaire */}
          <div className="form-group">
            <label className="form-label">Propriétaire</label>
            <div className="form-readonly">
              {productOwner ? 
                `${productOwner.firstName || ''} ${productOwner.lastName || ''} (${productOwner.email})` : 
                "Non trouvé"}
            </div>
          </div>

          {/* Certificat */}
          <div className="form-group">
            <label className="form-label">Certificat d'authenticité</label>
            <div className="form-readonly">
              {certificate ? (
                <button 
                  onClick={viewCertificate} 
                  className="btn btn-secondary btn-small"
                >
                  Voir le certificat
                </button>
              ) : (
                "Aucun certificat disponible"
              )}
            </div>
          </div>

          {/* Description (pleine largeur) */}
          <div className="form-group full-width">
            <label className="form-label">Description</label>
            <div className="form-readonly" style={{ minHeight: "100px" }}>
              {product?.description ? (
                <div dangerouslySetInnerHTML={{ __html: product.description }} />
              ) : (
                <p>Aucune description disponible.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Formulaire d'upload IPFS */}
      {showUploadIpfsForm && (
        <div className="edit-form-container" style={{ marginTop: "2rem" }}>
          <h2 className="card-title" style={{ marginBottom: "1.5rem" }}>
            {nftResource ? 'Mettre à jour le NFT Resource' : 'Créer un NFT Resource'}
          </h2>
          <form onSubmit={handleUploadOnIpfs} className="edit-form">
            <div className="form-group">
              <label htmlFor="name" className="form-label">Nom du NFT</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleFormChange}
                className={`form-input ${formErrors.name ? 'input-error' : ''}`}
                placeholder="Nom du NFT"
              />
              {formErrors.name && <p className="form-error">{formErrors.name}</p>}
            </div>
            
            <div className="form-group">
              <label htmlFor="collection" className="form-label">Collection</label>
              <select
                id="collection"
                name="collection"
                value={formData.collection}
                onChange={handleFormChange}
                className={`form-select ${formErrors.collection ? 'input-error' : ''}`}
              >
                <option value="">Sélectionner une collection</option>
                {collections.map(collection => (
                  <option key={collection.id} value={collection.id}>
                    {collection.name} ({collection.symbol})
                  </option>
                ))}
              </select>
              {formErrors.collection && <p className="form-error">{formErrors.collection}</p>}
            </div>
            
            <div className="form-group full-width">
              <label htmlFor="description" className="form-label">Description</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                className={`form-textarea ${formErrors.description ? 'input-error' : ''}`}
                rows={4}
                placeholder="Description du NFT"
              ></textarea>
              {formErrors.description && <p className="form-error">{formErrors.description}</p>}
            </div>
            
            <div className="form-group">
              <label htmlFor="image" className="form-label">Image du NFT</label>
              <input
                type="file"
                id="image"
                name="image"
                onChange={handleFormChange}
                className={`form-input ${formErrors.image ? 'input-error' : ''}`}
                accept="image/*"
              />
              {formErrors.image && <p className="form-error">{formErrors.image}</p>}
              <p className="form-helper-text">Format recommandé: JPG, PNG ou WEBP, maximum 10MB</p>
            </div>
            
            <div className="form-group">
              <label htmlFor="certificate" className="form-label">Certificat d'authenticité</label>
              <input
                type="file"
                id="certificate"
                name="certificate"
                onChange={handleFormChange}
                className={`form-input ${formErrors.certificate ? 'input-error' : ''}`}
                accept="application/pdf"
              />
              {formErrors.certificate && <p className="form-error">{formErrors.certificate}</p>}
              <p className="form-helper-text">Fichier PDF uniquement, maximum 10MB</p>
            </div>
            
            <div className="form-group full-width">
              <div className="d-flex align-items-center gap-sm">
                <input
                  type="checkbox"
                  id="intellectualProperty"
                  name="intellectualProperty"
                  checked={formData.intellectualProperty}
                  onChange={handleFormChange}
                  className="form-checkbox"
                />
                <label htmlFor="intellectualProperty" className="form-label mb-0">
                  Je certifie être le propriétaire des droits intellectuels de ces fichiers
                </label>
              </div>
            </div>
            
            <div className="form-actions full-width">
              <button
                type="button"
                onClick={() => setShowUploadIpfsForm(false)}
                className="btn btn-secondary btn-medium"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-medium "
                disabled={!formData.intellectualProperty}
              >
                Uploader sur IPFS
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* Informations du NFT */}
      {nftResource && (
        <div className="edit-form-container" style={{ marginTop: "2rem" }}>
          <h2 className="card-title" style={{ marginBottom: "1.5rem" }}>Informations du NFT</h2>
          <div className="edit-form">
            <div className="form-group">
              <label className="form-label">ID</label>
              <div className="form-readonly">{nftResource.id}</div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Nom</label>
              <div className="form-readonly">{nftResource.name}</div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Statut</label>
              <div className="form-readonly"><NftStatusBadge status={nftResource.status} /></div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Collection</label>
              <div className="form-readonly">
                {nftResource.collection?.name} ({nftResource.collection?.symbol})
              </div>
            </div>
            
            {nftResource.imageUri && (
              <div className="form-group full-width">
                <label className="form-label">Image URI</label>
                <IpfsUriField label="" uri={nftResource.imageUri} />
              </div>
            )}
            
            {nftResource.certificateUri && (
              <div className="form-group full-width">
                <label className="form-label">Certificat URI</label>
                <IpfsUriField label="" uri={nftResource.certificateUri} />
              </div>
            )}
            
            {nftResource.metadataUri && (
              <div className="form-group full-width">
                <label className="form-label">Metadata URI</label>
                <IpfsUriField label="" uri={nftResource.metadataUri} />
              </div>
            )}
            
            {nftResource.tokenId !== null && (
              <div className="form-group">
                <label className="form-label">Token ID</label>
                <div className="form-readonly">{nftResource.tokenId}</div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Actions */}
      <div className="form-actions" style={{ marginTop: "2rem" }}>
        <button
          onClick={handleCancel}
          className="btn btn-secondary btn-medium"
        >
          Retour à la liste
        </button>
        
        {nftResource && nftResource.status === 'UPLOADIPFS' && (
          <button
            onClick={() => setShowUploadIpfsForm(!showUploadIpfsForm)}
            className="btn btn-primary btn-medium"
          >
            {showUploadIpfsForm ? 'Masquer le formulaire' : 'Uploader sur IPFS'}
          </button>
        )}
        
        {!nftResource && (
          <button
            onClick={() => setShowUploadIpfsForm(!showUploadIpfsForm)}
            className="btn btn-primary btn-medium"
          >
            {showUploadIpfsForm ? 'Masquer le formulaire' : 'Créer NFT Resource'}
          </button>
        )}
        
        {nftResource && nftResource.status === 'UPLOADMETADATA' && (
          <button
            onClick={handleMintNFT}
            className="btn btn-primary btn-medium"
            disabled={isMinting || !isConnected || isCheckingMinter || !isMinter}
          >
            {isMinting ? 'Minting en cours...' : isCheckingMinter ? 'Vérification des permissions...' : !isMinter ? 'Non autorisé à minter' : 'Minter le NFT'}
          </button>
        )}
      </div>
    </div>
  )
} 