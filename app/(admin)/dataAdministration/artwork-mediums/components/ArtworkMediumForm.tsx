'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArtworkMedium } from '@prisma/client'
import { createArtworkMedium, updateArtworkMedium } from '@/lib/actions/artwork-medium-actions'
import { handleEntityTranslations } from '@/lib/actions/translation-actions'
import { useToast } from '@/app/components/Toast/ToastContext'
import TranslationField from '@/app/components/TranslationField'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

// Schéma de validation
const formSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  isEligibleReducedVat: z.boolean()
})

type FormValues = z.infer<typeof formSchema>

interface ArtworkMediumFormProps {
  artworkMedium?: ArtworkMedium // Optional - si présent, c'est une édition, sinon c'est une création
}

export default function ArtworkMediumForm({ artworkMedium }: ArtworkMediumFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { success, error } = useToast()
  const isEditing = !!artworkMedium
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: artworkMedium?.name || '',
      isEligibleReducedVat: artworkMedium?.isEligibleReducedVat ?? true
    }
  })

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    
    try {
      let result
      let mediumId
      
      if (isEditing && artworkMedium) {
        // Mise à jour
        result = await updateArtworkMedium(artworkMedium.id, {
          name: data.name,
          isEligibleReducedVat: data.isEligibleReducedVat
        })
        mediumId = artworkMedium.id
      } else {
        // Création
        result = await createArtworkMedium({
          name: data.name,
          isEligibleReducedVat: data.isEligibleReducedVat
        })
        mediumId = result.id
      }
      
      if (result.success && mediumId) {
        success(isEditing ? 'Medium d\'œuvre mis à jour avec succès' : 'Medium d\'œuvre créé avec succès')
        
        // Gestion des traductions pour le nom
        try {
          await handleEntityTranslations('ArtworkMedium', mediumId, {
            name: data.name
          })
        } catch (translationError) {
          console.error('Erreur lors de la gestion des traductions:', translationError)
          // On ne bloque pas l'opération en cas d'erreur de traduction
        }
        
        // Rediriger après 1 seconde
        setTimeout(() => {
          router.push('/dataAdministration/artwork-mediums')
          router.refresh()
        }, 1000)
      } else {
        error(result.message || 'Une erreur est survenue')
      }
    } catch (error: any) {
      error(`Une erreur est survenue lors de ${isEditing ? 'la mise à jour' : 'la création'}`)
      console.error(error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleCancel = () => {
    router.push('/dataAdministration/artwork-mediums')
  }
  
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">
            {isEditing ? 'Modifier le medium d\'œuvre' : 'Ajouter un medium d\'œuvre'}
          </h1>
        </div>
        <p className="page-subtitle">
          {isEditing ? 'Modifier les informations du medium d\'œuvre' : 'Créer un nouveau medium d\'œuvre'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="form-container">
        <div className="form-card">
          <div className="card-header">
            <h2 className="card-title">Informations du medium</h2>
          </div>
          <div className="card-content">
            <TranslationField
              entityType="ArtworkMedium"
              entityId={artworkMedium?.id || null}
              field="name"
              label="Nom du medium"
              required={true}
              errorMessage={errors.name?.message}
            >
              <input
                id="name"
                type="text"
                {...register('name')}
                className={`form-input ${errors.name ? 'input-error' : ''}`}
                placeholder="ex: Huile sur toile, Aquarelle, Sculpture bronze..."
              />
            </TranslationField>

            <div className="form-control">
              <label className="label cursor-pointer justify-start gap-2">
                <input
                  type="checkbox"
                  {...register('isEligibleReducedVat')}
                  className="checkbox checkbox-sm"
                />
                <span className="label-text">Éligible TVA réduite (5,5 %)</span>
              </label>
              <p className="text-sm text-base-content/70 mt-1">
                Art. 278 septies CGI : œuvres originales éligibles à la TVA réduite
              </p>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={handleCancel}
            className="btn btn-secondary"
            disabled={isSubmitting}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-medium"
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? (isEditing ? 'Mise à jour en cours...' : 'Création en cours...') 
              : (isEditing ? 'Mettre à jour' : 'Créer le medium')
            }
          </button>
        </div>
      </form>
    </div>
  )
} 