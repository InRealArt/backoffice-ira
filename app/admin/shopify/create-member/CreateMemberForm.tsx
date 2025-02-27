'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { memberSchema, MemberFormData } from './schema'
import { createMember } from '@/app/actions/prisma/prismaActions'
import toast from 'react-hot-toast'
import './CreateMemberForm.css'

export default function CreateMemberForm() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
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
    try {
      const result = await createMember(data)
      
      if (result.success) {
        toast.success(result.message, {
          duration: 5000, // Durée plus longue sur mobile
          position: window.innerWidth < 768 ? 'bottom-center' : 'top-right'
        })
        reset()
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
              className={`form-input ${errors.firstName ? 'form-input-error' : ''}`}
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
              className={`form-input ${errors.lastName ? 'form-input-error' : ''}`}
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
            className={`form-input ${errors.email ? 'form-input-error' : ''}`}
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
            onClick={() => reset()}
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