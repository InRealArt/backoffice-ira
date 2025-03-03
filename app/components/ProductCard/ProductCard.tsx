'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { requestArtworkListing } from '@/app/actions/artwork/requestListingActions'
import { toast } from 'react-hot-toast'
import styles from './ProductCard.module.scss'

interface ProductCardProps {
  title: string
  price: string
  currency: string
  imageUrl: string | null
  imageAlt?: string
  idShopify?: string
  handle?: string
  collectionId?: string
  userId?: number
}

export default function ProductCard({ 
  title, 
  price, 
  currency, 
  imageUrl, 
  imageAlt = title,
  idShopify,
  handle,
  collectionId,
  userId
}: ProductCardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isError, setIsError] = useState(false)

  // Formatage du prix
  const formattedPrice = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(parseFloat(price))

  const handleListArtwork = async (e: React.MouseEvent) => {
    e.preventDefault() // Empêche le déclenchement du lien parent
    
    if (!idShopify || !collectionId || !userId || !imageUrl) {
      toast.error('Informations manquantes pour lister l\'œuvre')
      setIsError(true)
      return
    }

    try {
      setIsLoading(true)
      setIsError(false)
      
      const result = await requestArtworkListing({
        idProductShopify: typeof idShopify === 'string' ? parseInt(idShopify) : idShopify,
        idCollectionShopify: typeof collectionId === 'string' ? parseInt(collectionId) : collectionId,
        idUser: typeof userId === 'string' ? parseInt(userId) : userId,
        image: imageUrl
      })

      if (result.success) {
        setIsSuccess(true)
        toast.success(result.message)
      } else {
        setIsError(true)
        toast.error(result.message)
      }
    } catch (error) {
      console.error('Erreur:', error)
      setIsError(true)
      toast.error('Une erreur est survenue')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Link href={`/shopify/editArtwork/${idShopify}`} className={styles.cardLink}>
      <div className={styles.card}>
        <div className={styles.imageContainer}>
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={imageAlt || title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className={styles.image}
            />
          ) : (
            <div className={styles.placeholder}>
              <span>Aucune image</span>
            </div>
          )}
        </div>
        <div className={styles.content}>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.price}>{formattedPrice}</p>
          
          <button 
            className={styles.listButton}
            onClick={handleListArtwork}
            disabled={isLoading || isSuccess}
          >
            {isLoading ? 'Chargement...' : 
             isSuccess ? 'Demande envoyée' : 
             isError ? 'Erreur, réessayer' : 
             'Lister l\'œuvre sur la marketplace'}
          </button>
        </div>
      </div>
    </Link>
  )
} 