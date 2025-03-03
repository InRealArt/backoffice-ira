'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import Button from '@/app/components/Button/Button'
import { getShopifyProductById, updateShopifyProduct } from '@/app/actions/shopify/shopifyActions'
import toast, { Toaster } from 'react-hot-toast'
import styles from './editArtwork.module.scss'

export default function EditArtworkPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { user } = useDynamicContext()
  const [isLoading, setIsLoading] = useState(true)
  const [product, setProduct] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  
  // États du formulaire
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!user?.email) {
      setError('Vous devez être connecté pour éditer une œuvre')
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
        
        if (isMounted) {
          if (result.success && result.product) {
            setProduct(result.product)
            // Initialiser les champs du formulaire
            setTitle(result.product.title || '')
            setDescription(result.product.description || '')
            setPrice(result.product.price || '0')
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
  }, [params.id, user?.email])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    try {
      const productId = params.id.includes('gid://shopify/Product/') 
        ? params.id.split('/').pop() 
        : params.id
        
      const result = await updateShopifyProduct(productId as string, {
        title,
        description,
        price: parseFloat(price)
      })
      
      if (result.success) {
        toast.success('Œuvre mise à jour avec succès')
        // Rediriger après succès
        setTimeout(() => {
          router.push('/shopify/collection')
        }, 1500)
      } else {
        toast.error(result.message || 'Erreur lors de la mise à jour')
      }
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour:', error)
      toast.error(error.message || 'Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Toaster position="top-center" />
      <div className={styles.container}>
        <h1 className={styles.pageTitle}>Éditer l'œuvre</h1>
        
        {isLoading ? (
          <LoadingSpinner message="Chargement de l'œuvre..." />
        ) : error ? (
          <div className={styles.error}>{error}</div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            {product?.imageUrl && (
              <div className={styles.imagePreview}>
                <img src={product.imageUrl} alt={product.title} />
              </div>
            )}
            
            <div className={styles.formGroup}>
              <label htmlFor="title" className={styles.label}>Titre</label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className={styles.input}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="description" className={styles.label}>Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={5}
                className={styles.textarea}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="price" className={styles.label}>Prix (€)</label>
              <input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
                className={styles.input}
              />
            </div>
            
            <div className={styles.buttonGroup}>
              <Button 
                type="button" 
                variant="secondary"
                onClick={() => router.back()}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                variant="primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </>
  )
} 