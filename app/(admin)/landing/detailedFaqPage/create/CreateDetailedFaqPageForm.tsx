'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/app/components/Toast/ToastContext'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createDetailedFaqPage } from '@/lib/actions/faq-page-actions'
import { LandingPage } from '@prisma/client'
import { getAvailableLandingPages } from '@/lib/actions/faq-page-actions'

// Schéma de validation pour le formulaire principal
const formSchema = z.object({
  name: z.string().min(1, 'La page est requise')
})

type FormValues = z.infer<typeof formSchema>

export default function CreateDetailedFaqPageForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availablePages, setAvailablePages] = useState<string[]>([])
  const { success, error } = useToast()

  // Charger les pages disponibles au chargement du composant
  useEffect(() => {
    const loadAvailablePages = async () => {
      try {
        const pages = await getAvailableLandingPages()
        setAvailablePages(pages)
      } catch (error: any) {
        console.error('Erreur lors du chargement des pages disponibles:', error)
        error('Impossible de charger la liste des pages disponibles')
      }
    }
    
    loadAvailablePages()
  }, [])

  // Formulaire principal pour le DetailedFaqPage
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
      const result = await createDetailedFaqPage(data.name as LandingPage)
      
      if (result.success && result.data) {
        success('FAQ pour la page créée avec succès')
        
        // Rediriger vers la page d'édition
        setTimeout(() => {
          router.push(`/landing/detailedFaqPage/${result.data.id}/edit`)
          router.refresh()
        }, 1000)
      } else {
        error(result.message || 'Une erreur est survenue')
        setIsSubmitting(false)
      }
    } catch (error: any) {
      error('Une erreur est survenue lors de la création')
      console.error(error)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">Créer une nouvelle FAQ pour une page</h1>
        </div>
        <p className="page-subtitle">
          Créez une nouvelle FAQ spécifique à une page du site
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="form-container">
        <div className="form-card">
          <div className="card-content">
            <div className="form-group">
              <label htmlFor="name" className="form-label">Page du site</label>
              <select
                id="name"
                {...register('name')}
                className={`form-select ${errors.name ? 'input-error' : ''}`}
                disabled={availablePages.length === 0}
              >
                <option value="">Sélectionnez une page</option>
                {availablePages.map((page) => (
                  <option key={page} value={page}>
                    {page === '/' ? 'Page d\'accueil' : page}
                  </option>
                ))}
              </select>
              {errors.name && (
                <p className="form-error">{errors.name.message}</p>
              )}
              {availablePages.length === 0 && (
                <p className="form-info">
                  Aucune page disponible. Toutes les pages ont déjà une FAQ associée.
                </p>
              )}
            </div>
          </div>
          
          <div className="card-footer">
            <div className="d-flex justify-content-between">
              <button
                type="button"
                onClick={() => router.push('/landing/detailedFaqPage')}
                className="btn btn-secondary btn-medium"
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-medium"
                disabled={isSubmitting || availablePages.length === 0}
              >
                {isSubmitting ? 'Création...' : 'Créer la FAQ'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
} 