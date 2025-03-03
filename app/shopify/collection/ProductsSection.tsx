'use client'

import { useState, useEffect } from 'react'
import { getShopifyCollectionProducts } from '@/app/actions/shopify/shopifyActions'
import ProductCard from '@/app/components/ProductCard/ProductCard'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import Button from '@/app/components/Button/Button'
import styles from './collection.module.scss'

interface ProductsSectionProps {
  collectionId: string
}

export default function ProductsSection({ collectionId }: ProductsSectionProps) {
  const [collectionProducts, setCollectionProducts] = useState<any[]>([])
  const [isLoadingProducts, setIsLoadingProducts] = useState(true)

  useEffect(() => {
    let isMounted = true
    
    const fetchProducts = async () => {
      try {
        const result = await getShopifyCollectionProducts(collectionId)
        if (result.success && result.products && isMounted) {
          setCollectionProducts(result.products)
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des produits:', error)
      } finally {
        if (isMounted) {
          setIsLoadingProducts(false)
        }
      }
    }
    
    fetchProducts()
    
    return () => {
      isMounted = false
    }
  }, [collectionId])

  return (
    <div className={styles.productsSection}>
      <h3 className={styles.sectionTitle}>Mes œuvres</h3>
      
      {isLoadingProducts ? (
        <div className={styles.loadingProducts}>
          <LoadingSpinner message="Chargement des œuvres..." />
        </div>
      ) : collectionProducts.length > 0 ? (
        <div className={styles.productsGrid}>
          {collectionProducts.map(product => (
            <ProductCard
              key={product.id}
              id={product.id}
              title={product.title}
              price={product.price}
              currency={product.currency}
              imageUrl={product.imageUrl}
              imageAlt={product.imageAlt}
              handle={product.handle}
            />
          ))}
        </div>
      ) : (
        <div className={styles.emptyProducts}>
          <p>Aucune œuvre n'a été ajoutée à votre collection.</p>
          <Button 
            variant="primary"
            onClick={() => window.location.href = '/shopify/createArtwork'}
          >
            Ajouter une œuvre
          </Button>
        </div>
      )}
    </div>
  )
} 