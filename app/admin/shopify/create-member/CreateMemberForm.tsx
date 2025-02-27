'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { memberSchema, MemberFormData } from './schema'
import { createMember, checkUserExists } from '@/app/actions/prisma/prismaActions'
import toast from 'react-hot-toast'
import './CreateMemberForm.css'
import { createShopifyCollection } from '@/app/actions/shopify/shopifyActions'

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
    <div className="form-container">
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Affichage de l'erreur d'unicité globale */}
        {uniqueError && (
          <div className="unique-error-container">
            <p className="unique-error">{uniqueError}</p>
          </div>
        )}
        
        <div className="form-grid">
          {/* Prénom */}
          <div className="form-group">
            <label htmlFor="firstName" className="form-label">
              Prénom
            </label>
            <input
              id="firstName"
              type="text"
              {...register('firstName')}
              className={`form-input ${errors.firstName || uniqueError ? 'form-input-error' : ''}`}
              placeholder="John"
            />
            {errors.firstName && (
              <p className="form-error">{errors.firstName.message}</p>
            )}
          </div>
          
          {/* Nom */}
          <div className="form-group">
            <label htmlFor="lastName" className="form-label">
              Nom
            </label>
            <input
              id="lastName"
              type="text"
              {...register('lastName')}
              className={`form-input ${errors.lastName || uniqueError ? 'form-input-error' : ''}`}
              placeholder="Doe"
            />
            {errors.lastName && (
              <p className="form-error">{errors.lastName.message}</p>
            )}
          </div>
        </div>
        
        {/* Email */}
        <div className="form-group">
          <label htmlFor="email" className="form-label">
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className={`form-input ${errors.email || uniqueError ? 'form-input-error' : ''}`}
            placeholder="email@exemple.com"
          />
          {errors.email && (
            <p className="form-error">{errors.email.message}</p>
          )}
        </div>
        
        {/* Type */}
        <div className="form-group">
          <label htmlFor="type" className="form-label">
            Type
          </label>
          <select
            id="type"
            {...register('role')}
            className="form-select"
          >
            <option value="artist">Artiste</option>
            <option value="galleryManager">Galleriste</option>
          </select>
          {errors.role && (
            <p className="form-error">{errors.role.message}</p>
          )}
        </div>
        
        <div className="form-actions">
          <button
            type="button"
            onClick={() => {
              reset()
              setUniqueError(null)
            }}
            className="button button-secondary"
            disabled={isSubmitting}
          >
            Réinitialiser
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="button button-primary"
          >
            {isSubmitting ? 'Création en cours...' : 'Créer le membre'}
          </button>
        </div>
      </form>
    </div>
  )
} 