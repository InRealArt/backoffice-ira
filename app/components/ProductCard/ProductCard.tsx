'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import styles from './ProductCard.module.scss'
import { updateItemStatus, checkItemStatus } from '@/app/actions/prisma/prismaActions'

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
  const [isCheckingStatus, setIsCheckingStatus] = useState(true)
  
  // Formatage du prix
  const formattedPrice = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(parseFloat(price))

  // Vérifier au chargement si l'item a le statut "pending"
  useEffect(() => {
    async function verifyItemStatus() {
      if (!idShopify || !userId) {
        setIsCheckingStatus(false)
        return
      }

      try {
        const statusResult = await checkItemStatus({
          idProductShopify: typeof idShopify === 'string' ? parseInt(idShopify) : idShopify,
          idUser: typeof userId === 'string' ? parseInt(userId) : userId
        })
        
        if (statusResult.exists && statusResult.status === 'pending') {
          setIsSuccess(true)
        }
      } catch (error) {
        console.error('Erreur lors de la vérification du statut:', error)
      } finally {
        setIsCheckingStatus(false)
      }
    }

    verifyItemStatus()
  }, [idShopify, userId])

  const handleListArtwork = async (e: React.MouseEvent) => {
    e.preventDefault() // Empêche le déclenchement du lien parent
    
    if (!idShopify || !userId) {
      toast.error('Informations manquantes pour mettre à jour le statut')
      setIsError(true)
      return
    }

    try {
      setIsLoading(true)
      setIsError(false)
      
      // Mise à jour simple du statut à 'pending'
      const result = await updateItemStatus({
        idProductShopify: typeof idShopify === 'string' ? parseInt(idShopify) : idShopify,
        idUser: typeof userId === 'string' ? parseInt(userId) : userId,
        status: 'pending'
      })

      if (result.success) {
        setIsSuccess(true)
        toast.success('Demande de listing envoyée')
      } else {
        setIsError(true)
        toast.error(result.message || 'Échec de la mise à jour du statut')
      }
    } catch (error) {
      console.error('Erreur:', error)
      setIsError(true)
      toast.error('Une erreur est survenue lors de la mise à jour du statut')
    } finally {
      setIsLoading(false)
    }
  }

  const getButtonText = () => {
    if (isCheckingStatus) return 'Vérification...'
    if (isLoading) return 'Chargement...'
    if (isSuccess) return 'Demande de listing envoyée'
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
            disabled={isLoading || isSuccess || isCheckingStatus}
          >
            {getButtonText()}
          </button>
        </div>
      </div>
    </Link>
  )
} 