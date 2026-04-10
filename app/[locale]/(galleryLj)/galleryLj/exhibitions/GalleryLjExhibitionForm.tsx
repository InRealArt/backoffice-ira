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
  createGalleryLjExhibition,
  updateGalleryLjExhibition,
  getGalleryLjExhibitionById
} from '@/lib/actions/gallery-lj-exhibition-actions'
import { uploadGalleryLjExhibitionImage } from '@/lib/r2/storage'
import { getImageUrlWithCacheBuster } from '@/lib/r2/url'
import { normalizeString } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const galleryLjExhibitionSchema = z.object({
  name: z.string().min(1, "Le nom de l'exposition est obligatoire"),
  description: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  location: z.string().optional(),
  visible: z.boolean().default(true)
})

type GalleryLjExhibitionFormValues = z.infer<typeof galleryLjExhibitionSchema>

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface GalleryLjExhibitionFormProps {
  mode: 'create' | 'edit'
  exhibitionId?: number
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function GalleryLjExhibitionForm({ mode, exhibitionId }: GalleryLjExhibitionFormProps) {
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
  } = useForm<GalleryLjExhibitionFormValues>({
    resolver: zodResolver(galleryLjExhibitionSchema),
    defaultValues: {
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      location: '',
      visible: true
    }
  })

  // -------------------------------------------------------------------------
  // Load existing exhibition in edit mode
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (mode !== 'edit' || !exhibitionId) return

    const fetchExhibition = async () => {
      setIsLoading(true)
      try {
        const exhibition = await getGalleryLjExhibitionById(exhibitionId)
        if (exhibition) {
          setValue('name', exhibition.name)
          setValue('description', exhibition.description ?? '')
          setValue(
            'startDate',
            exhibition.startDate
              ? new Date(exhibition.startDate).toISOString().split('T')[0]
              : ''
          )
          setValue(
            'endDate',
            exhibition.endDate
              ? new Date(exhibition.endDate).toISOString().split('T')[0]
              : ''
          )
          setValue('location', exhibition.location ?? '')
          setValue('visible', exhibition.visible)
          if (exhibition.imageUrl) {
            setImagePreview(getImageUrlWithCacheBuster(exhibition.imageUrl) ?? '')
          }
        }
      } catch {
        showError("Erreur lors du chargement de l'exposition")
      } finally {
        setIsLoading(false)
      }
    }

    fetchExhibition()
  }, [mode, exhibitionId, setValue, showError])

  const handleCancel = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push(`/${locale}/galleryLj/exhibitions`)
    }
  }

  // -------------------------------------------------------------------------
  // Validation error handler — fired by react-hook-form when Zod validation fails
  // -------------------------------------------------------------------------
  const onInvalid = useCallback((fieldErrors: FieldErrors<GalleryLjExhibitionFormValues>) => {
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
  const onSubmit = async (values: GalleryLjExhibitionFormValues) => {
    setIsSubmitting(true)
    try {
      let imageUrl: string | undefined

      // Upload image if a new file was selected
      if (imageFile) {
        setUploadingImage(true)
        const exhibitionSlug = normalizeString(values.name)
        imageUrl = await uploadGalleryLjExhibitionImage(imageFile, exhibitionSlug)
        setUploadingImage(false)
      }

      // Parse optional date fields
      const startDate = values.startDate && values.startDate.trim() !== ''
        ? new Date(values.startDate)
        : null
      const endDate = values.endDate && values.endDate.trim() !== ''
        ? new Date(values.endDate)
        : null

      if (mode === 'create') {
        const result = await createGalleryLjExhibition({
          name: values.name,
          description: values.description?.trim() || null,
          startDate,
          endDate,
          location: values.location?.trim() || null,
          imageUrl: imageUrl ?? null,
          visible: values.visible
        })

        if (result.success) {
          success('Exposition créée avec succès')
          router.push(`/${locale}/galleryLj/exhibitions`)
        } else {
          showError(result.message ?? 'Erreur lors de la création')
        }
      } else if (mode === 'edit' && exhibitionId) {
        const updateData: Parameters<typeof updateGalleryLjExhibition>[1] = {
          name: values.name,
          description: values.description?.trim() || null,
          startDate,
          endDate,
          location: values.location?.trim() || null,
          visible: values.visible
        }
        if (imageUrl !== undefined) {
          updateData.imageUrl = imageUrl
        }

        const result = await updateGalleryLjExhibition(exhibitionId, updateData)

        if (result.success) {
          success('Exposition mise à jour avec succès')
          router.push(`/${locale}/galleryLj/exhibitions`)
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

          {/* Nom */}
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Nom <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              className={`form-input ${errors.name ? 'input-error' : ''}`}
              placeholder="Nom de l'exposition"
              {...register('name')}
            />
            {errors.name && (
              <p className="form-error">{errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description
            </label>
            <textarea
              id="description"
              className="form-input"
              placeholder="Description de l'exposition"
              rows={4}
              {...register('description')}
            />
          </div>

          {/* Lieu */}
          <div className="form-group">
            <label htmlFor="location" className="form-label">
              Lieu
            </label>
            <input
              id="location"
              type="text"
              className="form-input"
              placeholder="ex: Galerie LJ, Paris"
              {...register('location')}
            />
          </div>

          {/* Date de début */}
          <div className="form-group">
            <label htmlFor="startDate" className="form-label">
              Date de début
            </label>
            <input
              id="startDate"
              type="date"
              className="form-input"
              {...register('startDate')}
            />
          </div>

          {/* Date de fin */}
          <div className="form-group">
            <label htmlFor="endDate" className="form-label">
              Date de fin
            </label>
            <input
              id="endDate"
              type="date"
              className="form-input"
              {...register('endDate')}
            />
          </div>

          {/* Image upload */}
          <div className="form-group">
            <label className="form-label">
              Image d&apos;affiche
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
                  <input {...getImageInputProps()} ref={imageInputRef} id="exhibition-image-input" />
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      const input = document.getElementById('exhibition-image-input') as HTMLInputElement
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

          {/* Visible */}
          <div className="form-group">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="form-checkbox"
                {...register('visible')}
              />
              <span className="form-label mb-0">Visible sur la galerie</span>
            </label>
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
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner size="small" message="" inline />
              {mode === 'create' ? 'Création...' : 'Mise à jour...'}
            </>
          ) : mode === 'create' ? (
            "Créer l'exposition"
          ) : (
            'Enregistrer'
          )}
        </button>
      </div>
    </form>
  )
}
