'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { memberSchema, MemberFormData } from '../../../admin/shopify/create-member/schema'
import { createMember, checkUserExists } from '@/app/actions/prisma/prismaActions'
import toast from 'react-hot-toast'
import styles from './CreateMemberForm.module.scss'
import { createShopifyCollection } from '@/app/actions/shopify/shopifyActions'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'

export default function CreateMemberForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uniqueError, setUniqueError] = useState<string | null>(null)
  
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      role: 'artist'
    }
  })
  
  const onSubmit = async (data: MemberFormData) => {
    setIsSubmitting(true)
    setUniqueError(null)
    
    try {
      // Vérifier d'abord l'unicité du trio email+nom+prénom
      const uniqueCheck = await checkUserExists({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName
      })
      
      if (!uniqueCheck.unique) {
        setUniqueError(uniqueCheck.message)
        setIsSubmitting(false)
        return
      }
      
      // Si la vérification d'unicité est passée, créer le membre
      const result = await createMember(data)
      
      if (result.success) {
        if (data.role === 'artist') {
          const collectionName = `${data.firstName} ${data.lastName}`
          const collectionResult = await createShopifyCollection(collectionName)
          
          if (collectionResult.success) {
            toast.success(`Membre créé et collection "${collectionName}" créée avec succès!`, {
              duration: 5000,
              position: window.innerWidth < 768 ? 'bottom-center' : 'top-right'
            })
          } else {
            toast.success(`Membre créé avec succès, mais la création de la collection a échoué: ${collectionResult.message}`, {
              duration: 5000,
              position: window.innerWidth < 768 ? 'bottom-center' : 'top-right'
            })
          }
        } else {
          toast.success(result.message, {
            duration: 5000,
            position: window.innerWidth < 768 ? 'bottom-center' : 'top-right'
          })
        }
        reset()
        setUniqueError(null)
      } else {
        toast.error(result.message, {
          duration: 5000,
          position: window.innerWidth < 768 ? 'bottom-center' : 'top-right'
        })
      }
    } catch (error) {
      toast.error('Une erreur est survenue. Veuillez réessayer.', {
        duration: 5000,
        position: window.innerWidth < 768 ? 'bottom-center' : 'top-right'
      })
      console.error('Erreur de formulaire:', error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <div className={styles.formContainer}>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Affichage de l'erreur d'unicité globale */}
        {uniqueError && (
          <div className={styles.uniqueErrorContainer}>
            <p className={styles.uniqueError}>{uniqueError}</p>
          </div>
        )}
        
        <div className={styles.formGrid}>
          {/* Prénom */}
          <div className={styles.formGroup}>
            <label htmlFor="firstName" className={styles.formLabel}>
              Prénom
            </label>
            <input
              id="firstName"
              type="text"
              {...register('firstName')}
              className={`${styles.formInput} ${errors.firstName || uniqueError ? styles.formInputError : ''}`}
              placeholder="John"
            />
            {errors.firstName && (
              <p className={styles.formError}>{errors.firstName.message}</p>
            )}
          </div>
          
          {/* Nom */}
          <div className={styles.formGroup}>
            <label htmlFor="lastName" className={styles.formLabel}>
              Nom
            </label>
            <input
              id="lastName"
              type="text"
              {...register('lastName')}
              className={`${styles.formInput} ${errors.lastName || uniqueError ? styles.formInputError : ''}`}
              placeholder="Doe"
            />
            {errors.lastName && (
              <p className={styles.formError}>{errors.lastName.message}</p>
            )}
          </div>
        </div>
        
        {/* Email */}
        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.formLabel}>
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className={`${styles.formInput} ${errors.email || uniqueError ? styles.formInputError : ''}`}
            placeholder="email@exemple.com"
          />
          {errors.email && (
            <p className={styles.formError}>{errors.email.message}</p>
          )}
        </div>
        
        {/* Type */}
        <div className={styles.formGroup}>
          <label htmlFor="role" className={styles.formLabel}>
            Rôle
          </label>
          <select
            id="role"
            {...register('role')}
            className={styles.formSelect}
          >
            <option value="artist">Artiste</option>
            <option value="galleryManager">Responsable de galerie</option>
            <option value="admin">Administrateur</option>
          </select>
          {errors.role && (
            <p className={styles.formError}>{errors.role.message}</p>
          )}
        </div>
        
        <div className={styles.formActions}>
          <button
            type="button"
            onClick={() => {
              reset()
              setUniqueError(null)
            }}
            className={styles.buttonSecondary}
            disabled={isSubmitting}
          >
            Réinitialiser
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={styles.buttonPrimary}
          >
            {isSubmitting ? (
              <span className={styles.loadingContainer}>
                <LoadingSpinner size="small" message="" inline color="light" />
                <span className={styles.loadingText}>Création en cours...</span>
              </span>
            ) : (
              'Créer le membre'
            )}
          </button>
        </div>
      </form>
    </div>
  )
} 