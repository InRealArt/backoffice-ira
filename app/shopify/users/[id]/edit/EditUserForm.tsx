'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { UserEditFormData, userEditSchema } from '../../schema'
import { updateShopifyUser } from '@/app/actions/prisma/prismaActions'
import { ShopifyUser } from '@prisma/client'
import { ShopifyCollectionForm } from './ShopifyCollectionForm'
import styles from './EditUserForm.module.scss'

interface EditUserFormProps {
  user: ShopifyUser
}

export default function EditUserForm({ user }: EditUserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formMessage, setFormMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null)
  const router = useRouter()

  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<UserEditFormData>({
    resolver: zodResolver(userEditSchema),
    defaultValues: {
      id: user.id.toString(),
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      role: user.role || null,
      walletAddress: user.walletAddress || '',
      isShopifyGranted: user.isShopifyGranted || false,
    }
  })

  const onSubmit = async (data: UserEditFormData) => {
    setIsSubmitting(true)
    setFormMessage(null)

    try {
      const result = await updateShopifyUser(data)
      
      if (result.success) {
        setFormMessage({ 
          type: 'success', 
          message: 'Utilisateur mis à jour avec succès' 
        })
        // Rediriger après 2 secondes
        setTimeout(() => {
          router.push('/shopify/users')
          router.refresh()
        }, 2000)
      } else {
        setFormMessage({ 
          type: 'error', 
          message: result.message 
        })
      }
    } catch (error) {
      setFormMessage({ 
        type: 'error', 
        message: 'Une erreur est survenue lors de la mise à jour de l\'utilisateur' 
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

      

      {user.isShopifyGranted && <ShopifyCollectionForm user={user} />}

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