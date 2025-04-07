'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createArtist } from '@/lib/actions/artist-actions'
import Image from 'next/image'

// Schéma de validation
const formSchema = z.object({
  name: z.string().min(1, 'Le prénom est requis'),
  surname: z.string().min(1, 'Le nom est requis'),
  pseudo: z.string().min(1, 'Le pseudo est requis'),
  description: z.string().min(10, 'La description doit contenir au moins 10 caractères'),
  artworkStyle: z.string().nullable().optional(),
  artistsPage: z.boolean().default(false),
  publicKey: z.string().optional().or(z.literal('')),
  imageUrl: z.string().url('URL d\'image invalide').optional().or(z.literal('')),
  isGallery: z.boolean().default(false),
  backgroundImage: z.string().optional().or(z.literal('')).nullable(),
})

type FormValues = z.infer<typeof formSchema>

export default function CreateArtistForm() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty, isValid }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      surname: '',
      pseudo: '',
      description: '',
      artworkStyle: '',
      artistsPage: false,
      publicKey: '',
      imageUrl: '',
      isGallery: false,
      backgroundImage: '',
    }
  })

  const imageUrl = watch('imageUrl')
  const isGallery = watch('isGallery')

  // Cette fonction est appelée lorsqu'il y a des erreurs de validation dans le formulaire
  const onError = (errors: any) => {
    console.error('Erreurs de validation du formulaire:', errors)
    setFormError('Le formulaire contient des erreurs. Veuillez les corriger avant de soumettre.')
    setIsSubmitting(false)
  }

  const onSubmit = async (data: FormValues) => {
    // Réinitialiser les états d'erreur
    setFormError(null)
    setIsSubmitting(true)
    
    // Log pour débogage
    console.log('Données du formulaire à soumettre:', data)

    try {
      // Transformer undefined en null pour backgroundImage
      const formattedData = {
        ...data,
        artworkStyle: data.artworkStyle || null,
        backgroundImage: data.backgroundImage || null,
        publicKey: data.publicKey || `default-${Date.now()}`,
        imageUrl: data.imageUrl || `https://via.placeholder.com/200x200?text=${data.name.charAt(0)}${data.surname.charAt(0)}`
      }
      
      // Log pour débogage
      console.log('Données formatées à envoyer à l\'API:', formattedData)
      
      // Appel de la fonction server action
      const result = await createArtist(formattedData)
      console.log('Résultat de la création:', result)

      if (result.success) {
        toast.success('Artiste créé avec succès')

        // Rediriger immédiatement
        router.push('/dataAdministration/artists')
        router.refresh()
      } else {
        console.error('Erreur retournée par l\'API:', result.message)
        toast.error(result.message || 'Une erreur est survenue')
        setFormError(result.message || 'Échec de la création de l\'artiste')
        setIsSubmitting(false)
      }
    } catch (error: any) {
      console.error('Exception lors de la création de l\'artiste:', error)
      const errorMessage = error.message || 'Une erreur est survenue lors de la création'
      toast.error(errorMessage)
      setFormError(errorMessage)
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/dataAdministration/artists')
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">Créer un artiste</h1>
        </div>
        <p className="page-subtitle">
          Ajouter un nouvel artiste dans le système
        </p>
      </div>

      {formError && (
        <div className="alert alert-danger" style={{ marginBottom: '20px', padding: '10px 15px', borderRadius: '4px', backgroundColor: '#f8d7da', color: '#721c24', border: '1px solid #f5c6cb' }}>
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit, onError)} className="form-container">
        <div className="form-card">
          <div className="card-content">
            <div className="d-flex gap-lg">
              <div className="d-flex flex-column gap-md" style={{ width: '200px' }}>
                {imageUrl ? (
                  <div style={{ position: 'relative', width: '200px', height: '200px', borderRadius: '8px', overflow: 'hidden' }}>
                    <Image
                      src={imageUrl}
                      alt="Aperçu"
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                ) : (
                  <div style={{ width: '200px', height: '200px', borderRadius: '8px', backgroundColor: '#e0e0e0', color: '#666', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', fontSize: '1.5rem' }}>
                    Aperçu
                  </div>
                )}
                <div className="form-group">
                  <label htmlFor="imageUrl" className="form-label">URL de l'image (facultatif)</label>
                  <input
                    id="imageUrl"
                    type="text"
                    {...register('imageUrl')}
                    className={`form-input ${errors.imageUrl ? 'input-error' : ''}`}
                    placeholder="https://example.com/image.jpg"
                  />
                  {errors.imageUrl && (
                    <p className="form-error">{errors.imageUrl.message}</p>
                  )}
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <div className="form-group">
                  <div className="d-flex align-items-center gap-md" style={{ marginBottom: '20px' }}>
                    <span className={isGallery ? 'text-muted' : 'text-primary'} style={{ fontWeight: isGallery ? 'normal' : 'bold' }}>Artiste</span>
                    <label className="d-flex align-items-center" style={{ position: 'relative', display: 'inline-block', width: '60px', height: '30px' }}>
                      <input
                        type="checkbox"
                        {...register('isGallery')}
                        style={{ opacity: 0, width: 0, height: 0 }}
                      />
                      <span style={{ position: 'absolute', cursor: 'pointer', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: isGallery ? '#4f46e5' : '#ccc', borderRadius: '34px', transition: '0.4s' }}>
                        <span style={{ position: 'absolute', content: '""', height: '22px', width: '22px', left: '4px', bottom: '4px', backgroundColor: 'white', borderRadius: '50%', transition: '0.4s', transform: isGallery ? 'translateX(30px)' : 'translateX(0)' }}></span>
                      </span>
                    </label>
                    <span className={isGallery ? 'text-primary' : 'text-muted'} style={{ fontWeight: isGallery ? 'bold' : 'normal' }}>Galerie</span>
                  </div>

                  <div className="d-flex gap-md">
                    <div className="form-group" style={{ flex: 1 }}>
                      <label htmlFor="name" className="form-label">Prénom</label>
                      <input
                        id="name"
                        type="text"
                        {...register('name')}
                        className={`form-input ${errors.name ? 'input-error' : ''}`}
                      />
                      {errors.name && (
                        <p className="form-error">{errors.name.message}</p>
                      )}
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label htmlFor="surname" className="form-label">Nom</label>
                      <input
                        id="surname"
                        type="text"
                        {...register('surname')}
                        className={`form-input ${errors.surname ? 'input-error' : ''}`}
                      />
                      {errors.surname && (
                        <p className="form-error">{errors.surname.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="pseudo" className="form-label">Pseudo</label>
                    <input
                      id="pseudo"
                      type="text"
                      {...register('pseudo')}
                      className={`form-input ${errors.pseudo ? 'input-error' : ''}`}
                    />
                    {errors.pseudo && (
                      <p className="form-error">{errors.pseudo.message}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="form-card">
          <div className="card-content">
            <div className="form-group">
              <label htmlFor="description" className="form-label">Description</label>
              <textarea
                id="description"
                {...register('description')}
                className={`form-textarea ${errors.description ? 'input-error' : ''}`}
                rows={5}
              />
              {errors.description && (
                <p className="form-error">{errors.description.message}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="artworkStyle" className="form-label">Style d'art (facultatif)</label>
              <input
                id="artworkStyle"
                type="text"
                {...register('artworkStyle')}
                className={`form-input ${errors.artworkStyle ? 'input-error' : ''}`}
              />
              {errors.artworkStyle && (
                <p className="form-error">{errors.artworkStyle.message}</p>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="publicKey" className="form-label">Clé publique (facultatif)</label>
              <input
                id="publicKey"
                type="text"
                {...register('publicKey')}
                className={`form-input ${errors.publicKey ? 'input-error' : ''}`}
              />
              {errors.publicKey && (
                <p className="form-error">{errors.publicKey.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={handleCancel}
            className="btn btn-secondary btn-medium"
            disabled={isSubmitting}
          >
            Annuler
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-medium"
            disabled={isSubmitting || !isDirty}
          >
            {isSubmitting ? (
              <>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <span className="loading-spinner" style={{ width: '16px', height: '16px', border: '2px solid #fff', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></span>
                  Création en cours...
                </span>
              </>
            ) : (
              'Créer l\'artiste'
            )}
          </button>
        </div>
      </form>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
} 