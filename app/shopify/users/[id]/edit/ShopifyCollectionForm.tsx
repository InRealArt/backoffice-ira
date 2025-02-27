'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import { 
  getShopifyCollectionByTitle, 
  updateShopifyCollection, 
  createShopifyCollection 
} from '@/app/actions/shopify/shopifyActions'
import { ShopifyUser } from '@prisma/client'

// Schéma de validation pour le formulaire de collection
const collectionSchema = z.object({
  title: z.string()
    .min(2, { message: 'Le titre doit comporter au moins 2 caractères' })
    .max(100, { message: 'Le titre ne peut pas dépasser 100 caractères' }),
  description: z.string()
    .max(500, { message: 'La description ne peut pas dépasser 500 caractères' })
    .optional(),
  isPublished: z.boolean().default(false)
})

type CollectionFormData = z.infer<typeof collectionSchema>

export function ShopifyCollectionForm({ user }: { user: ShopifyUser }) {
  const [isLoading, setIsLoading] = useState(true)
  const [collectionExists, setCollectionExists] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [collectionId, setCollectionId] = useState<string | null>(null)
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null)

  const { 
    register, 
    handleSubmit, 
    reset,
    formState: { errors } 
  } = useForm<CollectionFormData>({
    resolver: zodResolver(collectionSchema),
    defaultValues: {
      title: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      description: '',
      isPublished: false
    }
  })

  // Récupérer les informations de la collection
  useEffect(() => {
    const fetchCollectionDetails = async () => {
      if (!user.firstName && !user.lastName) {
        setIsLoading(false)
        return
      }

      try {
        const collectionName = `${user.firstName || ''} ${user.lastName || ''}`.trim()
        
        const result = await getShopifyCollectionByTitle(collectionName)
        
        if (result.success && result.collection) {
          setCollectionExists(true)
          setCollectionId(result.collection.id)
          
          // Mettre à jour les valeurs du formulaire
          reset({
            title: result.collection.title || collectionName,
            description: result.collection.body_html || '',
            isPublished: result.collection.published || false
          })
        } else {
          setCollectionExists(false)
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de la collection:', error)
        toast.error('Impossible de récupérer les détails de la collection')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCollectionDetails()
  }, [user.firstName, user.lastName, reset])

  const onSubmit = async (data: CollectionFormData) => {
    setIsSubmitting(true)
    setFormMessage(null)

    try {
      if (collectionExists && collectionId) {
        // Mettre à jour la collection existante
        const result = await updateShopifyCollection(collectionId, {
          title: data.title,
          description: data.description,
          isPublished: data.isPublished
        })
        
        if (result.success) {
          setFormMessage({ 
            type: 'success', 
            message: 'Collection mise à jour avec succès' 
          })
          toast.success('Collection mise à jour avec succès')
        } else {
          setFormMessage({ 
            type: 'error', 
            message: result.message || 'Erreur lors de la mise à jour de la collection' 
          })
          toast.error(result.message || 'Erreur lors de la mise à jour de la collection')
        }
      } else {
        // Créer une nouvelle collection
        const result = await createShopifyCollection(data.title)
        
        if (result.success) {
          setCollectionExists(true)
          setCollectionId(result.collection?.id)
          setFormMessage({ 
            type: 'success', 
            message: 'Collection créée avec succès' 
          })
          toast.success('Collection créée avec succès')
        } else {
          setFormMessage({ 
            type: 'error', 
            message: result.message || 'Erreur lors de la création de la collection' 
          })
          toast.error(result.message || 'Erreur lors de la création de la collection')
        }
      }
    } catch (error) {
      console.error('Erreur lors de la gestion de la collection:', error)
      setFormMessage({ 
        type: 'error', 
        message: 'Une erreur est survenue lors de la gestion de la collection' 
      })
      toast.error('Une erreur est survenue lors de la gestion de la collection')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="collection-form-container">
        <div className="loading-message">
          Chargement des informations de la collection...
        </div>
      </div>
    )
  }

  return (
    <div className="collection-form-container">
      <div className="collection-form-header">
        <h2 className="section-title">Collection Shopify</h2>
        <p className="subtitle">
          {collectionExists 
            ? 'Modifier les informations de la collection Shopify associée' 
            : 'Créer une collection Shopify pour cet utilisateur'}
        </p>
      </div>

      {formMessage && (
        <div className={`form-message ${formMessage.type === 'success' ? 'success-message' : 'error-message-banner'}`}>
          {formMessage.message}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="collection-form">
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="title">Titre de la collection : {user.firstName} {user.lastName}</label>
          </div>

          <div className="form-field">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              rows={4}
              {...register('description')}
            />
            {errors.description && (
              <p className="error-message">{errors.description.message}</p>
            )}
          </div>

        {/*
          <div className="form-field checkbox-field">
            <label htmlFor="isPublished" className="checkbox-label">
              <input
                id="isPublished"
                type="checkbox"
                {...register('isPublished')}
              />
              <span>Collection publiée</span>
            </label>
            {errors.isPublished && (
              <p className="error-message">{errors.isPublished.message}</p>
            )}
          </div>
        */}
        </div>
        

      </form>
    </div>
  )
}