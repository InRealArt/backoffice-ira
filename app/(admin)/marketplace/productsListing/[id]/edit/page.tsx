'use client'

import { useState, useEffect, Usable } from 'react'
import { useRouter } from 'next/navigation'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import Button from '@/app/components/Button/Button'
import { getShopifyProductById } from '@/app/actions/shopify/shopifyActions'
import { getAuthCertificateByItemId, getItemByShopifyId, getUserByItemId } from '@/app/actions/prisma/prismaActions'
import { Toaster } from 'react-hot-toast'
import styles from './viewProduct.module.scss'
import React from 'react'

type ParamsType = { id: string }

export default function ViewProductPage({ params }: { params: ParamsType }) {
  const router = useRouter()
  const { user } = useDynamicContext()
  const [isLoading, setIsLoading] = useState(true)
  const [product, setProduct] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [certificate, setCertificate] = useState<any>(null)
  const [productOwner, setProductOwner] = useState<any>(null)
  const [item, setItem] = useState<any>(null)
  const [showUploadIpfsForm, setShowUploadIpfsForm] = useState(false)
  const [collections, setCollections] = useState<any[]>([])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    collection: '',
    image: null as File | null,
    certificate: null as File | null,
    intellectualProperty: false
  })
  
  const unwrappedParams = React.use(params as any) as ParamsType
  const id = unwrappedParams.id


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
        console.log('Shopify Product:', result)
        if (isMounted) {
          if (result.success && result.product) {
            setProduct(result.product)
            
            // Convertir result.product.id en nombre
            const shopifyProductId = typeof result.product.id === 'string' 
              ? BigInt(result.product.id.replace('gid://shopify/Product/', ''))
              : BigInt(result.product.id)

            // Rechercher l'Item associé 
            const itemResult = await getItemByShopifyId(shopifyProductId)
            console.log('Item Result:', itemResult)
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

  // Fonction pour soumettre le formulaire
  const handleListingSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // Ici, implémentation de la logique pour créer la liste sur la marketplace
      console.log('Données du formulaire:', formData)
      console.log('Item à lister sur la marketplace:', item)
      
      // Après le traitement réussi
      setShowUploadIpfsForm(false)
      // Ajouter un toast de succès ou rediriger l'utilisateur
    } catch (error) {
      console.error('Erreur lors de la création de la liste:', error)
      // Afficher une erreur
    }
  }

  // Fonction pour gérer l'action selon le statut de l'item
  const handleItemAction = async () => {
    if (item?.status === 'pending') {
      console.log('ShowListingForm')
      // Afficher le formulaire pour lister sur la marketplace
      setShowUploadIpfsForm(true)
    } else {
      // Logique pour mint NFT
      console.log('Mint NFT pour le produit:', product.id)
      // Appel à l'API de mint
    }
  }

  // Détermine le texte du bouton en fonction du statut de l'item
  const getActionButtonText = () => {
    return item?.status === 'minted' ? 'Lister sur la marketplace' : 'Mint NFT'
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
                  <h2 className={styles.productTitle}>{product.title}</h2>
                  
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
                
                {showUploadIpfsForm && item?.status === 'pending' ? (
                  <div className={styles.listingFormContainer}>
                    <h3 className={styles.formTitle}>Upload sur IPFS</h3>
                    <form onSubmit={handleListingSubmit} className={styles.listingForm}>
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