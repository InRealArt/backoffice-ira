'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { updateItemStatus } from '@/lib/actions/prisma-actions'
import toast from 'react-hot-toast'
import styles from './ProductCard.module.scss'

type ProductCardProps = {
  id: number
  name: string
  mainImageUrl: string
  userId?: number
  status?: string
  tags?: string[]
  physicalItem?: {
    id: number
    status: string
    price?: number
  } | null
  nftItem?: {
    id: number
    status: string
    price?: number
  } | null
}

export default function ProductCard({
  id,
  name,
  mainImageUrl,
  userId,
  tags = [],
  physicalItem,
  nftItem
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [physicalStatus, setPhysicalStatus] = useState(physicalItem?.status)
  const [nftStatus, setNftStatus] = useState(nftItem?.status)

  // Formater un prix en euros
  const formatPrice = (price?: number) => {
    if (!price && price !== 0) return null
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price)
  }

  const allSpecificCreated = [physicalStatus, nftStatus].filter(Boolean).every(s => s === 'created')

  const handleRequestListing = async () => {
    try {
      setIsSubmitting(true)
      const result = await updateItemStatus(id, 'pending')
      if (result && result.success) {
        if (physicalStatus === 'created') setPhysicalStatus('pending')
        if (nftStatus === 'created') setNftStatus('pending')
        toast.success('Demande de listing envoyée avec succès')
      } else {
        const errorMessage = result?.message || 'Erreur lors de la demande de listing'
        toast.error(errorMessage)
      }
    } catch (error: any) {
      console.error('Erreur lors de la demande de listing:', error)
      toast.error(error.message || 'Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  function getStatusColor(status?: string) {
    switch(status) {
      case 'created': return '#3498db'
      case 'pending': return '#f39c12'
      case 'minted': return '#2ecc71'
      case 'listed': return '#9b59b6'
      default: return '#7f8c8d'
    }
  }

  function getStatusLabel(status?: string) {
    switch(status) {
      case 'created': return 'Créée'
      case 'pending': return 'En attente'
      case 'minted': return 'Mintée'
      case 'listed': return 'En vente'
      default: return status
    }
  }

  return (
    <div 
      className="product-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="product-status-badge" style={{ backgroundColor: getStatusColor(physicalStatus || nftStatus) }}>
        {getStatusLabel(physicalStatus || nftStatus)}
      </div>
      
      <div className="product-image-container">
        <Image
          src={mainImageUrl || '/images/no-image.jpg'}
          alt={name}
          width={300}
          height={300}
          className="product-image"
          priority
        />
        
        {isHovered && userId && (
          <div className={styles.productOverlay}>
            <Link 
              href={`/art/editArtwork/${id}`} 
              className={styles.editButton}
            >
              Modifier
            </Link>
            
            <div className={styles.badgesContainer}>
              {physicalItem && (
                <div className={styles.badgeItem}>
                  <span className={styles.badgeType}>
                    Œuvre physique
                    {physicalItem.price !== undefined && (
                      <span className={styles.badgePrice}>
                        {formatPrice(physicalItem.price)}
                      </span>
                    )}
                  </span>
                  <div className={styles.badgeStatusContainer}>
                    <span className={styles.badgeStatusLabel}>Statut:</span>
                    <span 
                      className={styles.badgeStatus} 
                      style={{ backgroundColor: getStatusColor(physicalStatus) }}
                    >
                      {getStatusLabel(physicalStatus)}
                    </span>
                  </div>
                </div>
              )}
              
              {nftItem && (
                <div className={styles.badgeItem}>
                  <span className={styles.badgeTypeNFT}>
                    NFT
                    {nftItem.price !== undefined && (
                      <span className={styles.badgePrice}>
                        {formatPrice(nftItem.price)}
                      </span>
                    )}
                  </span>
                  <div className={styles.badgeStatusContainer}>
                    <span className={styles.badgeStatusLabel}>Statut:</span>
                    <span 
                      className={styles.badgeStatus} 
                      style={{ backgroundColor: getStatusColor(nftStatus) }}
                    >
                      {getStatusLabel(nftStatus)}
                    </span>
                  </div>
                </div>
              )}
            </div>
            
            {allSpecificCreated && (
              <button 
                onClick={handleRequestListing}
                disabled={isSubmitting}
                className={styles.listingButton}
              >
                {isSubmitting ? 'En cours...' : 'Demande de listing'}
              </button>
            )}
          </div>
        )}
      </div>
      
      <div className="product-content">
        <h3 className="product-title">{name}</h3>
        
        {tags && tags.length > 0 && (
          <div className="product-tags">
            {tags.slice(0, 3).map((tag, index) => (
              <span key={index} className="product-tag">{tag}</span>
            ))}
            {tags.length > 3 && <span className="product-tag">+{tags.length - 3}</span>}
          </div>
        )}
      </div>
    </div>
  )
} 