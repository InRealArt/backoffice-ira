'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArtworkTechnique } from '@prisma/client'
import { createArtworkTechnique, updateArtworkTechnique } from '@/lib/actions/artwork-technique-actions'
import { handleEntityTranslations } from '@/lib/actions/translation-actions'
import { useToast } from '@/app/components/Toast/ToastContext'
import TranslationField from '@/app/components/TranslationField'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

// Schéma de validation
const formSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
})

type FormValues = z.infer<typeof formSchema>

interface ArtworkTechniqueFormProps {
  artworkTechnique?: ArtworkTechnique // Optional - si présent, c'est une édition, sinon c'est une création
}

export default function ArtworkTechniqueForm({ artworkTechnique }: ArtworkTechniqueFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { success, error } = useToast()
  const isEditing = !!artworkTechnique
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: artworkTechnique?.name || '',
    }
  })

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    
    try {
      let result
      let techniqueId
      
      if (isEditing && artworkTechnique) {
        // Mise à jour
        result = await updateArtworkTechnique(artworkTechnique.id, data)
        techniqueId = artworkTechnique.id
      } else {
        // Création
        result = await createArtworkTechnique(data)
        techniqueId = result.id
      }
      
      if (result.success && techniqueId) {
        success(isEditing ? 'Technique d\'œuvre mise à jour avec succès' : 'Technique d\'œuvre créée avec succès')
        
        // Gestion des traductions pour le nom
        try {
          await handleEntityTranslations('ArtworkTechnique', techniqueId, {
            name: data.name
          })
        } catch (translationError) {
          console.error('Erreur lors de la gestion des traductions:', translationError)
          // On ne bloque pas l'opération en cas d'erreur de traduction
        }
        
        // Rediriger après 1 seconde
        setTimeout(() => {
          router.push('/dataAdministration/artwork-techniques')
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
    router.push('/dataAdministration/artwork-techniques')
  }
  
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">
            {isEditing ? 'Modifier la technique d\'œuvre' : 'Ajouter une technique d\'œuvre'}
          </h1>
        </div>
        <p className="page-subtitle">
          {isEditing ? 'Modifier les informations de la technique d\'œuvre' : 'Créer une nouvelle technique d\'œuvre'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="form-container">
        <div className="form-card">
          <div className="card-header">
            <h2 className="card-title">Informations de la technique</h2>
          </div>
          <div className="card-content">
            <TranslationField
              entityType="ArtworkTechnique"
              entityId={artworkTechnique?.id || null}
              field="name"
              label="Nom de la technique"
              required={true}
              errorMessage={errors.name?.message}
            >
              <input
                id="name"
                type="text"
                {...register('name')}
                className={`form-input ${errors.name ? 'input-error' : ''}`}
                placeholder="ex: Pinceau, Couteau, Spalter, Aérographe..."
              />
            </TranslationField>
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
              : (isEditing ? 'Mettre à jour' : 'Créer la technique')
            }
          </button>
        </div>
      </form>
    </div>
  )
} 