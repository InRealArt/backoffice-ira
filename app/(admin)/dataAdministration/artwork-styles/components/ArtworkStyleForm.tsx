'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArtworkStyle } from '@prisma/client'
import { createArtworkStyle, updateArtworkStyle } from '@/lib/actions/artwork-style-actions'
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

interface ArtworkStyleFormProps {
  artworkStyle?: ArtworkStyle // Optional - si présent, c'est une édition, sinon c'est une création
}

export default function ArtworkStyleForm({ artworkStyle }: ArtworkStyleFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { success, error } = useToast()
  const isEditing = !!artworkStyle
  
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: artworkStyle?.name || '',
    }
  })

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    
    try {
      let result
      let styleId
      
      if (isEditing && artworkStyle) {
        // Mise à jour
        result = await updateArtworkStyle(artworkStyle.id, data)
        styleId = artworkStyle.id
      } else {
        // Création
        result = await createArtworkStyle(data)
        styleId = result.id
      }
      
      if (result.success && styleId) {
        success(isEditing ? 'Style d\'œuvre mis à jour avec succès' : 'Style d\'œuvre créé avec succès')
        
        // Gestion des traductions pour le nom
        try {
          await handleEntityTranslations('ArtworkStyle', styleId, {
            name: data.name
          })
        } catch (translationError) {
          console.error('Erreur lors de la gestion des traductions:', translationError)
          // On ne bloque pas l'opération en cas d'erreur de traduction
        }
        
        // Rediriger après 1 seconde
        setTimeout(() => {
          router.push('/dataAdministration/artwork-styles')
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
    router.push('/dataAdministration/artwork-styles')
  }
  
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">
            {isEditing ? 'Modifier le style d\'œuvre' : 'Ajouter un style d\'œuvre'}
          </h1>
        </div>
        <p className="page-subtitle">
          {isEditing ? 'Modifier les informations du style d\'œuvre' : 'Créer un nouveau style d\'œuvre'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="form-container">
        <div className="form-card">
          <div className="card-header">
            <h2 className="card-title">Informations du style</h2>
          </div>
          <div className="card-content">
            <TranslationField
              entityType="ArtworkStyle"
              entityId={artworkStyle?.id || null}
              field="name"
              label="Nom du style"
              required={true}
              errorMessage={errors.name?.message}
            >
              <input
                id="name"
                type="text"
                {...register('name')}
                className={`form-input ${errors.name ? 'input-error' : ''}`}
                placeholder="ex: Impressionnisme, Cubisme, Art contemporain..."
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
              : (isEditing ? 'Mettre à jour' : 'Créer le style')
            }
          </button>
        </div>
      </form>
    </div>
  )
} 