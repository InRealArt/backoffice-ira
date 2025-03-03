'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { requestArtworkListing } from '@/app/actions/artwork/requestListingActions'
import { checkArtworkListingRequest } from '@/app/actions/prisma/prismaActions'
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
  const [hasExistingRequest, setHasExistingRequest] = useState(false)
  const [isCheckingRequest, setIsCheckingRequest] = useState(true)

  // Formatage du prix
  const formattedPrice = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(parseFloat(price))

  // Vérifier si une demande existe déjà au chargement
  useEffect(() => {
    async function checkExistingRequest() {
      if (!idShopify || !userId) return

      try {
        setIsCheckingRequest(true)
        const exists = await checkArtworkListingRequest({
          idProductShopify: typeof idShopify === 'string' ? parseInt(idShopify) : idShopify,
          idUser: typeof userId === 'string' ? parseInt(userId) : userId
        })
        
        setHasExistingRequest(exists)
        if (exists) {
          setIsSuccess(true)
        }
      } catch (error) {
        console.error('Erreur lors de la vérification:', error)
      } finally {
        setIsCheckingRequest(false)
      }
    }

    checkExistingRequest()
  }, [idShopify, userId])

  const handleListArtwork = async (e: React.MouseEvent) => {
    e.preventDefault() // Empêche le déclenchement du lien parent
    
    if (!idShopify || !collectionId || !userId || !imageUrl) {
      toast.error('Informations manquantes pour lister l\'œuvre')
      setIsError(true)
      return
    }

    if (hasExistingRequest) {
      toast.error('Une demande de listing existe déjà pour cette œuvre')
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
        setHasExistingRequest(true)
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

  const getButtonText = () => {
    if (isCheckingRequest) return 'Vérification...'
    if (isLoading) return 'Chargement...'
    if (hasExistingRequest || isSuccess) return 'Demande de listing sur marketplace envoyée'
    if (isError) return 'Erreur, réessayer'
    return 'Lister l\'œuvre sur la marketplace'
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
            disabled={isLoading || isSuccess || hasExistingRequest || isCheckingRequest}
          >
            {getButtonText()}
          </button>
        </div>
      </div>
    </Link>
  )
} 