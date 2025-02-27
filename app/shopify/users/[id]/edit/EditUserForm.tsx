'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'react-hot-toast'
import { UserEditFormData, userEditSchema } from '../../schema'
import { 
  updateShopifyUser,
} from '@/app/actions/prisma/prismaActions'
import {
  getShopifyCollectionByTitle,
  updateShopifyCollection,
  createShopifyCollection
} from '@/app/actions/shopify/shopifyActions'
import { ShopifyUser } from '@prisma/client'
import styles from './EditUserForm.module.scss'

interface EditUserFormProps {
  user: ShopifyUser
}

// Schéma de validation pour la collection
const collectionSchema = z.object({
  description: z.string()
    .max(500, { message: 'La description ne peut pas dépasser 500 caractères' })
    .optional(),
  isPublished: z.boolean().default(false)
})

// Schéma combiné pour le formulaire complet
const combinedSchema = userEditSchema.extend({
  collectionDescription: z.string().max(500).optional(),
})

type CombinedFormData = z.infer<typeof combinedSchema>

export default function EditUserForm({ user }: EditUserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const [collectionExists, setCollectionExists] = useState(false)
  const [collectionId, setCollectionId] = useState<string | null>(null)
  const [isLoadingCollection, setIsLoadingCollection] = useState(true)
  const router = useRouter()

  const { 
    register, 
    handleSubmit, 
    watch,
    setValue,
    formState: { errors } 
  } = useForm<CombinedFormData>({
    resolver: zodResolver(combinedSchema),
    defaultValues: {
      id: user.id.toString(),
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      role: user.role || null,
      walletAddress: user.walletAddress || '',
      isShopifyGranted: user.isShopifyGranted || false,
      collectionDescription: '',
    }
  })

  const isShopifyGranted = watch('isShopifyGranted')

  // Récupérer les informations de la collection si l'utilisateur a un accès Shopify
  useEffect(() => {
    const fetchCollectionDetails = async () => {
      if (!user.isShopifyGranted || (!user.firstName && !user.lastName)) {
        setIsLoadingCollection(false)
        return
      }

      try {
        const collectionName = `${user.firstName || ''} ${user.lastName || ''}`.trim()
        
        const result = await getShopifyCollectionByTitle(collectionName)
        
        if (result.success && result.collection) {
          setCollectionExists(true)
          setCollectionId(result.collection.id)
          
          // Mettre à jour la description de la collection dans le formulaire
          setValue('collectionDescription', result.collection.body_html || '')
        } else {
          setCollectionExists(false)
        }
      } catch (error) {
        console.error('Erreur lors de la récupération de la collection:', error)
        toast.error('Impossible de récupérer les détails de la collection')
      } finally {
        setIsLoadingCollection(false)
      }
    }

    if (user.isShopifyGranted) {
      fetchCollectionDetails()
    } else {
      setIsLoadingCollection(false)
    }
  }, [user, setValue])

  const onSubmit = async (data: CombinedFormData) => {
    setIsSubmitting(true)
    setFormMessage(null)

    try {
      // 1. Mettre à jour l'utilisateur
      const userResult = await updateShopifyUser({
        id: data.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        role: data.role,
        walletAddress: data.walletAddress,
        isShopifyGranted: data.isShopifyGranted
      })
      
      // 2. Si l'utilisateur a accès à Shopify, gérer la collection
      if (data.isShopifyGranted) {
        const collectionTitle = `${data.firstName} ${data.lastName}`.trim()
        
        if (collectionExists && collectionId) {
          // Mettre à jour la collection existante
          await updateShopifyCollection(collectionId, {
            title: collectionTitle,
            description: data.collectionDescription,
            isPublished: true
          })
        } else {
          // Créer une nouvelle collection
          const collectionResult = await createShopifyCollection(collectionTitle)
          
          if (collectionResult.success && collectionResult.collection && data.collectionDescription) {
            // Mettre à jour la description si une nouvelle collection a été créée
            await updateShopifyCollection(collectionResult.collection.id, {
              title: collectionTitle,
              description: data.collectionDescription,
              isPublished: true
            })
          }
        }
      }
      
      if (userResult.success) {
        setFormMessage({ 
          type: 'success', 
          message: 'Utilisateur et collection mis à jour avec succès' 
        })
        
        // Rediriger après 2 secondes
        setTimeout(() => {
          router.push('/shopify/users')
          router.refresh()
        }, 2000)
      } else {
        setFormMessage({ 
          type: 'error', 
          message: userResult.message 
        })
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      setFormMessage({ 
        type: 'error', 
        message: 'Une erreur est survenue lors de la mise à jour' 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className={styles.editUserContainer}>
      <div className={styles.editUserHeader}>
        <h1 className={styles.pageTitle}>Modifier l'utilisateur</h1>
        <p className={styles.subtitle}>
          Modifier les informations de {user.firstName} {user.lastName}
        </p>
      </div>

      {formMessage && (
        <div className={`${styles.formMessage} ${formMessage.type === 'success' ? styles.successMessage : styles.errorMessageBanner}`}>
          {formMessage.message}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.formSection}>
          <div className={styles.formGrid}>
            <div className={styles.formField}>
              <label htmlFor="firstName">Prénom</label>
              <input
                id="firstName"
                type="text"
                {...register('firstName')}
              />
              {errors.firstName && (
                <p className={styles.errorMessage}>{errors.firstName.message}</p>
              )}
            </div>

            <div className={styles.formField}>
              <label htmlFor="lastName">Nom</label>
              <input
                id="lastName"
                type="text"
                {...register('lastName')}
              />
              {errors.lastName && (
                <p className={styles.errorMessage}>{errors.lastName.message}</p>
              )}
            </div>

            <div className={styles.formField}>
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                {...register('email')}
              />
              {errors.email && (
                <p className={styles.errorMessage}>{errors.email.message}</p>
              )}
            </div>

            <div className={styles.formField}>
              <label htmlFor="role">Rôle</label>
              <select
                id="role"
                {...register('role')}
              >
                <option value="">Sélectionner un rôle</option>
                <option value="admin">Administrateur</option>
                <option value="artist">Artiste</option>
                <option value="galleryManager">Gestionnaire de galerie</option>
              </select>
              {errors.role && (
                <p className={styles.errorMessage}>{errors.role.message}</p>
              )}
            </div>

            <div className={styles.formField}>
              <label htmlFor="walletAddress">Adresse de portefeuille</label>
              <input
                id="walletAddress"
                type="text"
                {...register('walletAddress')}
                readOnly
                className={styles.readonlyField}
              />
              {errors.walletAddress && (
                <p className={styles.errorMessage}>{errors.walletAddress.message}</p>
              )}
            </div>

            <div className={`${styles.formField} ${styles.checkboxField}`}>
              <label htmlFor="isShopifyGranted" className={styles.checkboxLabel}>
                <input
                  id="isShopifyGranted"
                  type="checkbox"
                  {...register('isShopifyGranted')}
                />
                <span>Accès Shopify accordé</span>
              </label>
              {errors.isShopifyGranted && (
                <p className={styles.errorMessage}>{errors.isShopifyGranted.message}</p>
              )}
            </div>
          </div>
        </div>

        {isShopifyGranted && (
          <div className={styles.collectionSection}>
            <h2 className={styles.sectionTitle}>Collection Shopify</h2>
            <p className={styles.sectionSubtitle}>  
              {collectionExists 
                ? 'Modifier les informations de la collection Shopify associée' 
                : 'Créer une collection Shopify pour cet utilisateur'}
            </p>

            {isLoadingCollection ? (
              <div className={styles.loadingMessage}>
                Chargement des informations de la collection...
              </div>
            ) : (
              <div className={styles.formField}>
                <label htmlFor="collectionDescription">Description de la collection</label>
                <textarea
                  id="collectionDescription"
                  rows={4}
                  {...register('collectionDescription')}
                />
                {errors.collectionDescription && (
                  <p className={styles.errorMessage}>{errors.collectionDescription.message}</p>
                )}
                <p className={styles.htmlNote}>
                  Ce champ accepte le formatage HTML. Vous pouvez utiliser <a href="https://www.onetools.me/fr/html-editor/" target="_blank" rel="noopener noreferrer">cet éditeur HTML en ligne</a> pour mettre en forme votre description.
                </p>
              </div>
            )}
          </div>
        )}

        <div className={styles.formButtons}>
          <button 
            type="button" 
            className={styles.cancelButton} 
            onClick={handleCancel}
          >
            Annuler
          </button>
          <button 
            type="submit" 
            className={styles.submitButton} 
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Mise à jour...' : 'Mettre à jour'}
          </button>
        </div>
      </form>
    </div>
  )
} 