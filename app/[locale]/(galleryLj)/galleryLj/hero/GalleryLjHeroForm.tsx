'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useForm, FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Image from 'next/image'
import { useToast } from '@/app/components/Toast/ToastContext'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { useDropzone } from 'react-dropzone'
import { Camera, X } from 'lucide-react'
import {
  createGalleryLjHero,
  updateGalleryLjHero,
  getGalleryLjHeroById
} from '@/lib/actions/gallery-lj-hero-actions'
import { uploadGalleryLjHeroImage } from '@/lib/r2/storage'
import { getImageUrlWithCacheBuster } from '@/lib/r2/url'
import { normalizeString } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const galleryLjHeroSchema = z.object({
  title: z.string().min(1, 'Le titre est obligatoire'),
  text: z.string().optional(),
  ctaUrl: z.string().optional()
})

type GalleryLjHeroFormValues = z.infer<typeof galleryLjHeroSchema>

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface GalleryLjHeroFormProps {
  mode: 'create' | 'edit'
  heroId?: number
  hasReachedHeroLimit?: boolean
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function GalleryLjHeroForm({
  mode,
  heroId,
  hasReachedHeroLimit = false
}: GalleryLjHeroFormProps) {
  const router = useRouter()
  const params = useParams()
  const locale = (params.locale as string) || 'fr'
  const { success, error: showError } = useToast()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(mode === 'edit')
  const [imagePreview, setImagePreview] = useState<string>('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const imageInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors }
  } = useForm<GalleryLjHeroFormValues>({
    resolver: zodResolver(galleryLjHeroSchema),
    defaultValues: {
      title: '',
      text: '',
      ctaUrl: ''
    }
  })

  // -------------------------------------------------------------------------
  // Load existing hero in edit mode
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (mode !== 'edit' || !heroId) return

    const fetchHero = async () => {
      setIsLoading(true)
      try {
        const hero = await getGalleryLjHeroById(heroId)
        if (hero) {
          setValue('title', hero.title)
          setValue('text', hero.text ?? '')
          setValue('ctaUrl', hero.ctaUrl ?? '')
          if (hero.image) {
            setImagePreview(getImageUrlWithCacheBuster(hero.image) ?? '')
          }
        }
      } catch {
        showError('Erreur lors du chargement du héro')
      } finally {
        setIsLoading(false)
      }
    }

    fetchHero()
  }, [mode, heroId, setValue, showError])

  const handleCancel = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push(`/${locale}/galleryLj/hero`)
    }
  }

  // -------------------------------------------------------------------------
  // Validation error handler
  // -------------------------------------------------------------------------
  const onInvalid = useCallback((fieldErrors: FieldErrors<GalleryLjHeroFormValues>) => {
    const messages = Object.values(fieldErrors)
      .map((err) => err?.message)
      .filter((msg): msg is string => typeof msg === 'string' && msg.length > 0)

    if (messages.length > 0) {
      showError(messages.join(' — '), { duration: 5000 })
    }
  }, [showError])

  // -------------------------------------------------------------------------
  // Image upload via dropzone
  // -------------------------------------------------------------------------
  const handleImageDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      showError("Format d'image non supporté")
      return
    }

    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      showError('Image trop volumineuse (max 10MB)')
      return
    }

    setImageFile(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }, [showError])

  const {
    getRootProps: getImageRootProps,
    getInputProps: getImageInputProps,
    isDragActive: isImageDragActive,
  } = useDropzone({
    onDrop: handleImageDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    },
    maxFiles: 1,
    multiple: false,
    noClick: false,
    noKeyboard: false,
  })

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview('')
    if (imageInputRef.current) {
      imageInputRef.current.value = ''
    }
  }

  // -------------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------------
  const onSubmit = async (values: GalleryLjHeroFormValues) => {
    if (mode === 'create' && hasReachedHeroLimit) {
      showError('Un seul héro est autorisé. Supprimez le héro existant avant d\'en créer un nouveau.')
      return
    }

    setIsSubmitting(true)
    try {
      let imageUrl: string | undefined

      if (imageFile) {
        setUploadingImage(true)
        const heroSlug = normalizeString(values.title)
        imageUrl = await uploadGalleryLjHeroImage(imageFile, heroSlug)
        setUploadingImage(false)
      }

      if (mode === 'create') {
        if (!imageUrl) {
          showError("L'image est obligatoire pour créer un héro")
          return
        }

        const result = await createGalleryLjHero({
          image: imageUrl,
          title: values.title,
          text: values.text?.trim() || null,
          ctaUrl: values.ctaUrl?.trim() || null
        })

        if (result.success) {
          success('Héro créé avec succès')
          router.push(`/${locale}/galleryLj/hero`)
        } else {
          showError(result.message ?? 'Erreur lors de la création')
        }
      } else if (mode === 'edit' && heroId) {
        const updateData: Parameters<typeof updateGalleryLjHero>[1] = {
          title: values.title,
          text: values.text?.trim() || null,
          ctaUrl: values.ctaUrl?.trim() || null
        }
        if (imageUrl !== undefined) {
          updateData.image = imageUrl
        }

        const result = await updateGalleryLjHero(heroId, updateData)

        if (result.success) {
          success('Héro mis à jour avec succès')
          router.push(`/${locale}/galleryLj/hero`)
        } else {
          showError(result.message ?? 'Erreur lors de la mise à jour')
        }
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Erreur inattendue')
    } finally {
      setIsSubmitting(false)
      setUploadingImage(false)
    }
  }

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------
  if (isLoading) {
    return <LoadingSpinner message="Chargement..." />
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="form-container">
      <div className="form-card">
        <div className="card-content">

          {/* Titre */}
          <div className="form-group">
            <label htmlFor="title" className="form-label">
              Titre <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              className={`form-input ${errors.title ? 'input-error' : ''}`}
              placeholder="Titre de la section hero"
              {...register('title')}
            />
            {errors.title && (
              <p className="form-error">{errors.title.message}</p>
            )}
          </div>

          {/* Texte */}
          <div className="form-group">
            <label htmlFor="text" className="form-label">
              Texte descriptif
            </label>
            <textarea
              id="text"
              className="form-input"
              placeholder="Texte descriptif (optionnel)"
              rows={4}
              {...register('text')}
            />
          </div>

          {/* CTA URL */}
          <div className="form-group">
            <label htmlFor="ctaUrl" className="form-label">
              URL du bouton CTA
            </label>
            <input
              id="ctaUrl"
              type="text"
              className="form-input"
              placeholder="https://..."
              {...register('ctaUrl')}
            />
          </div>

          {/* Image upload */}
          <div className="form-group">
            <label className="form-label">
              Image hero {mode === 'create' && <span className="text-red-500">*</span>}
            </label>
            {!imagePreview ? (
              <div className="mb-3">
                <div
                  {...getImageRootProps()}
                  style={{
                    border: `2px dashed ${isImageDragActive ? '#4dabf7' : '#ccc'}`,
                    borderRadius: '8px',
                    padding: '1.5rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: isImageDragActive ? '#f0f8ff' : '#fafafa',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <input {...getImageInputProps()} ref={imageInputRef} id="hero-image-input" />
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      const input = document.getElementById('hero-image-input') as HTMLInputElement
                      if (input) {
                        input.click()
                      }
                    }}
                  >
                    <Camera size={24} color="#666" />
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>
                      {isImageDragActive ? "Déposez l'image ici" : 'Cliquez ou glissez une image'}
                    </p>
                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#666' }}>
                      JPG, PNG, WebP, GIF — convertie en WebP automatiquement
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
            {imagePreview && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '1rem',
                  marginTop: '1rem',
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    width: '200px',
                    height: '200px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                  }}
                >
                  <Image
                    src={imagePreview}
                    alt="Aperçu"
                    fill
                    style={{ objectFit: 'cover' }}
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      background: 'rgba(0, 0, 0, 0.7)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      padding: '4px 8px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      zIndex: 10,
                    }}
                    disabled={isSubmitting || uploadingImage}
                  >
                    <X size={14} /> Supprimer
                  </button>
                  {uploadingImage && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '8px',
                        left: '8px',
                        right: '8px',
                        background: 'rgba(0, 0, 0, 0.7)',
                        color: 'white',
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        textAlign: 'center',
                        zIndex: 10,
                      }}
                    >
                      Upload en cours...
                    </div>
                  )}
                </div>
              </div>
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
          disabled={isSubmitting || (mode === 'create' && hasReachedHeroLimit)}
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner size="small" message="" inline />
              {mode === 'create' ? 'Création...' : 'Mise à jour...'}
            </>
          ) : mode === 'create' ? (
            'Créer le héro'
          ) : (
            'Enregistrer'
          )}
        </button>
      </div>
    </form>
  )
}
