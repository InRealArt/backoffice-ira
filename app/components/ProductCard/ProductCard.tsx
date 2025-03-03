'use client'

import Image from 'next/image'
import Link from 'next/link'
import styles from './ProductCard.module.scss'

interface ProductCardProps {
  title: string
  price: string
  currency: string
  imageUrl: string | null
  imageAlt?: string
  id?: string
  handle?: string
}

export default function ProductCard({ 
  title, 
  price, 
  currency, 
  imageUrl, 
  imageAlt = title,
  id
}: ProductCardProps) {
  // Formatage du prix
  const formattedPrice = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2
  }).format(parseFloat(price))

  return (
    <Link href={`/shopify/editArtwork/${id}`} className={styles.cardLink}>
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
        </div>
      </div>
    </Link>
  )
} 