'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { updateItemStatus } from '@/lib/actions/prisma-actions'
import { useToast } from '@/app/components/Toast/ToastContext'
import styles from './ProductCard.module.scss'

type PhysicalArtworkCardProps = {
  id: number
  name: string
  mainImageUrl: string
  userId?: string
  tags?: string[]
  physicalItem: {
    id: number
    status: string
    price?: number
  }
}

export default function PhysicalArtworkCard({
  id,
  name,
  mainImageUrl,
  userId,
  tags = [],
  physicalItem
}: PhysicalArtworkCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [physicalStatus, setPhysicalStatus] = useState(physicalItem?.status)
  const { success, error: errorToast } = useToast()

  // Formater un prix en euros
  const formatPrice = (price?: number) => {
    if (!price && price !== 0) return null
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price)
  }

  const handleRequestListing = async () => {
    try {
      setIsSubmitting(true)
      const result = await updateItemStatus(id, 'pending')
      if (result && result.success) {
        if (physicalStatus === 'created') setPhysicalStatus('pending')
        success('Demande de listing envoyée avec succès')
      } else {
        const errorMessage = result?.message || 'Erreur lors de la demande de listing'
        errorToast(errorMessage)
      }
    } catch (error: any) {
      console.error('Erreur lors de la demande de listing:', error)
      errorToast(error.message || 'Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  function getStatusColor(status?: string) {
    switch (status) {
      case 'created': return '#3498db'
      case 'pending': return '#f39c12'
      case 'listed': return '#9b59b6'
      case 'sold': return '#2ecc71'
      default: return '#7f8c8d'
    }
  }

  function getStatusLabel(status?: string) {
    switch (status) {
      case 'created': return 'Créée'
      case 'pending': return 'En attente'
      case 'listed': return 'En vente'
      case 'sold': return 'Vendue'
      default: return status
    }
  }

  return (
    <div
      className="product-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="product-status-badge" style={{ backgroundColor: getStatusColor(physicalStatus) }}>
        {getStatusLabel(physicalStatus)}
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
            </div>

            {physicalStatus === 'created' && (
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
















