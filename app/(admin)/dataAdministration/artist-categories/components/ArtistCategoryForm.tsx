'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArtistCategory } from '@prisma/client'
import { createArtistCategory, updateArtistCategory } from '@/lib/actions/artist-categories-actions'
import { handleEntityTranslations } from '@/lib/actions/translation-actions'
import { useToast } from '@/app/components/Toast/ToastContext'
import TranslationField from '@/app/components/TranslationField'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import Image from 'next/image'

// Schéma de validation
const formSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  imageUrl: z.string().url('URL invalide').or(z.literal('')).optional()
})

type FormValues = z.infer<typeof formSchema>

interface ArtistCategoryFormProps {
  artistCategory?: ArtistCategory // Optional - si présent, c'est une édition, sinon c'est une création
}

export default function ArtistCategoryForm({ artistCategory }: ArtistCategoryFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { success, error } = useToast()
  const isEditing = !!artistCategory
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: artistCategory?.name || '',
      imageUrl: artistCategory?.imageUrl || ''
    }
  })

  const watchedImageUrl = watch('imageUrl')

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    
    try {
      let result
      let categoryId
      
      if (isEditing && artistCategory) {
        // Mise à jour
        result = await updateArtistCategory(artistCategory.id, {
          name: data.name,
          imageUrl: data.imageUrl && data.imageUrl.trim() !== '' ? data.imageUrl.trim() : null,
          description: artistCategory?.description ?? null
        })
        categoryId = artistCategory.id
      } else {
        // Création
        result = await createArtistCategory({
          name: data.name,
          imageUrl: data.imageUrl && data.imageUrl.trim() !== '' ? data.imageUrl.trim() : null,
          description: null
        })
        categoryId = result.id
      }
      
      if (result.success && categoryId) {
        success(isEditing ? 'Catégorie d\'artiste mise à jour avec succès' : 'Catégorie d\'artiste créée avec succès')
        
        // Gestion des traductions pour le nom
        try {
          await handleEntityTranslations('ArtistCategory', categoryId, {
            name: data.name
          })
        } catch (translationError) {
          console.error('Erreur lors de la gestion des traductions:', translationError)
          // On ne bloque pas l'opération en cas d'erreur de traduction
        }
        
        // Rediriger après 1 seconde
        setTimeout(() => {
          router.push('/dataAdministration/artist-categories')
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
    router.push('/dataAdministration/artist-categories')
  }
  
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">
            {isEditing ? 'Modifier la catégorie d\'artiste' : 'Ajouter une catégorie d\'artiste'}
          </h1>
        </div>
        <p className="page-subtitle">
          {isEditing ? 'Modifier les informations de la catégorie d\'artiste' : 'Créer une nouvelle catégorie d\'artiste'}
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="form-container">
        <div className="form-card">
          <div className="card-header">
            <h2 className="card-title">Informations de la catégorie</h2>
          </div>
          <div className="card-content">
            <TranslationField
              entityType="ArtistCategory"
              entityId={artistCategory?.id || null}
              field="name"
              label="Nom de la catégorie"
              required={true}
              errorMessage={errors.name?.message}
            >
              <input
                id="name"
                type="text"
                {...register('name')}
                className={`form-input ${errors.name ? 'input-error' : ''}`}
                placeholder="ex: Artistes célèbres, Choix des collectionneurs, Artistes à la une ..."
              />
            </TranslationField>
          </div>
        </div>

        <div className="form-card">
          <div className="card-header">
            <h2 className="card-title">Image de la catégorie</h2>
          </div>
          <div className="card-content">
            <div className="d-flex gap-lg">
              <div className="d-flex flex-column gap-md" style={{ width: '200px' }}>
                {watchedImageUrl ? (
                  <div style={{ position: 'relative', width: '200px', height: '200px', borderRadius: '8px', overflow: 'hidden' }}>
                    <Image
                      src={watchedImageUrl}
                      alt="Prévisualisation de la catégorie"
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                ) : (
                  <div style={{ width: '200px', height: '200px', borderRadius: '8px', backgroundColor: '#e0e0e0', color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600 }}>
                    Aucune image
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="imageUrl" className="form-label">URL de l'image</label>
                  <input
                    id="imageUrl"
                    type="text"
                    {...register('imageUrl')}
                    className={`form-input ${errors.imageUrl ? 'input-error' : ''}`}
                    placeholder="https://example.com/image.jpg"
                  />
                  {errors.imageUrl?.message && (
                    <p className="form-error">{errors.imageUrl.message}</p>
                  )}
                </div>
              </div>
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
              : (isEditing ? 'Mettre à jour' : 'Créer la catégorie')
            }
          </button>
        </div>
      </form>
    </div>
  )
} 