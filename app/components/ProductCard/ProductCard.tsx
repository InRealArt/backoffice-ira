'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { updateItemStatus } from '@/app/actions/prisma/prismaActions'
import toast from 'react-hot-toast'

type ProductCardProps = {
  id: number
  title: string
  price: string
  currency: string
  imageUrl: string
  idShopify: string
  userId?: number
  status?: string
  tags?: string[]
}

export default function ProductCard({
  id,
  title,
  price,
  currency,
  imageUrl,
  idShopify,
  userId,
  status = 'created',
  tags = []
}: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [itemStatus, setItemStatus] = useState(status)

  // Formatter le prix
  const formattedPrice = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency
  }).format(parseFloat(price))

  // Fonction pour gérer la demande de listing
  const handleRequestListing = async () => {
    try {
      setIsSubmitting(true)
      
      // Appeler la server action avec uniquement l'ID et le nouveau statut
      const result = await updateItemStatus(id, 'pending')
      
      if (result && result.success) {
        setItemStatus('pending')
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

  // Déterminer la couleur du statut
  const getStatusColor = () => {
    switch(itemStatus) {
      case 'created': return '#3498db' // bleu
      case 'pending': return '#f39c12' // orange
      case 'minted': return '#2ecc71'  // vert
      case 'listed': return '#9b59b6'  // violet
      default: return '#7f8c8d'        // gris
    }
  }

  // Traduire le statut
  const getStatusLabel = () => {
    switch(itemStatus) {
      case 'created': return 'Créée'
      case 'pending': return 'En attente'
      case 'minted': return 'Mintée'
      case 'listed': return 'En vente'
      default: return itemStatus
    }
  }

  return (
    <div 
      className="product-card"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="product-status-badge" style={{ backgroundColor: getStatusColor() }}>
        {getStatusLabel()}
      </div>
      
      <div className="product-image-container">
        <Image
          src={imageUrl || '/images/no-image.jpg'}
          alt={title}
          width={300}
          height={300}
          className="product-image"
          priority
        />
        
        {isHovered && userId && (
          <div className="product-overlay">
            <Link 
              href={`/shopify/editArtwork/${id}`} 
              className="product-edit-button"
            >
              Modifier
            </Link>
            
            {itemStatus === 'created' && (
              <button 
                onClick={handleRequestListing}
                disabled={isSubmitting}
                className="product-listing-button"
              >
                {isSubmitting ? 'En cours...' : 'Demande de listing'}
              </button>
            )}
          </div>
        )}
      </div>
      
      <div className="product-content">
        <h3 className="product-title">{title}</h3>
        <p className="product-price">{formattedPrice}</p>
        
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