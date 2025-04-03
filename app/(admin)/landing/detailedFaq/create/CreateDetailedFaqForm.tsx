'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createDetailedFaqHeader } from '@/lib/actions/faq-actions'
import { handleEntityTranslations } from '@/lib/actions/translation-actions'

// Schéma de validation pour le formulaire principal
const formSchema = z.object({
  name: z.string().min(1, 'Le nom est requis')
})

type FormValues = z.infer<typeof formSchema>

export default function CreateDetailedFaqForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Formulaire principal pour le DetailedFaqHeader
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: ''
    }
  })

  // Gestion de la soumission du formulaire principal
  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    
    try {
      const result = await createDetailedFaqHeader(data.name)
      
      if (result.success && result.data) {
        // Gestion des traductions pour le champ name
        try {
          await handleEntityTranslations('DetailedFaqHeader', result.data.id, {
            name: data.name
          })
        } catch (translationError) {
          console.error('Erreur lors de la gestion des traductions:', translationError)
          // On ne bloque pas la création en cas d'erreur de traduction
        }
        
        toast.success('Section de FAQ créée avec succès')
        
        // Rediriger vers la page d'édition
        setTimeout(() => {
          router.push(`/landing/detailedFaq/${result.data.id}/edit`)
          router.refresh()
        }, 1000)
      } else {
        toast.error(result.message || 'Une erreur est survenue')
        setIsSubmitting(false)
      }
    } catch (error: any) {
      toast.error('Une erreur est survenue lors de la création')
      console.error(error)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">Créer une nouvelle section de FAQ détaillée</h1>
        </div>
        <p className="page-subtitle">
          Créez une nouvelle section de FAQ détaillée pour le site
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="form-container">
        <div className="form-card">
          <div className="card-content">
            <div className="form-group">
              <label htmlFor="name" className="form-label">Nom de la section</label>
              <input
                id="name"
                type="text"
                {...register('name')}
                className={`form-input ${errors.name ? 'input-error' : ''}`}
                placeholder="Ex: Questions fréquentes sur les NFT"
              />
              {errors.name && (
                <p className="form-error">{errors.name.message}</p>
              )}
            </div>
          </div>
          
          <div className="card-footer">
            <div className="d-flex justify-content-between">
              <button
                type="button"
                onClick={() => router.push('/landing/detailedFaq')}
                className="btn btn-secondary btn-medium"
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-medium"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Création...' : 'Créer la section'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
} 