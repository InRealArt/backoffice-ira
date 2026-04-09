'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Image from 'next/image'
import { useToast } from '@/app/components/Toast/ToastContext'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { useDropzone } from 'react-dropzone'
import { Camera, X } from 'lucide-react'
import {
  createGalleryLjArtist,
  updateGalleryLjArtist,
  getGalleryLjArtistById
} from '@/lib/actions/gallery-lj-artist-actions'
import { uploadGalleryLjArtistImage } from '@/lib/r2/storage'
import { getImageUrlWithCacheBuster } from '@/lib/r2/url'
import { normalizeString } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const galleryLjArtistSchema = z.object({
  pseudo: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  visible: z.boolean().default(true)
}).refine(
  (data) => {
    // Soit le pseudo est renseigné, soit le nom + prénom
    const hasPseudo = data.pseudo && data.pseudo.trim().length > 0
    const hasFirstName = data.firstName && data.firstName.trim().length > 0
    const hasLastName = data.lastName && data.lastName.trim().length > 0
    
    return hasPseudo || (hasFirstName && hasLastName)
  },
  {
    message: 'Le pseudo est obligatoire, OU le nom et prénom doivent être renseignés',
    path: ['pseudo']
  }
)

type GalleryLjArtistFormValues = z.infer<typeof galleryLjArtistSchema>

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface GalleryLjArtistFormProps {
  mode: 'create' | 'edit'
  artistId?: number
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function GalleryLjArtistForm({ mode, artistId }: GalleryLjArtistFormProps) {
  const router = useRouter()
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
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<GalleryLjArtistFormValues>({
    resolver: zodResolver(galleryLjArtistSchema),
    defaultValues: {
      pseudo: '',
      firstName: '',
      lastName: '',
      visible: true
    }
  })

  // -------------------------------------------------------------------------
  // Load existing artist in edit mode
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (mode !== 'edit' || !artistId) return

    const fetchArtist = async () => {
      setIsLoading(true)
      try {
        const artist = await getGalleryLjArtistById(artistId)
        if (artist) {
          setValue('pseudo', artist.pseudo)
          setValue('firstName', artist.firstName ?? '')
          setValue('lastName', artist.lastName ?? '')
          setValue('visible', artist.visible)
          if (artist.imageUrl) {
            setImagePreview(getImageUrlWithCacheBuster(artist.imageUrl) ?? '')
          }
        }
      } catch {
        showError("Erreur lors du chargement de l'artiste")
      } finally {
        setIsLoading(false)
      }
    }

    fetchArtist()
  }, [mode, artistId, setValue, showError])

  const handleCancel = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push('/fr/galleryLj/artists')
    }
  }

  // Gestion de l'upload de l'image principale
  const handleMainImageDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      showError('Format d\'image non supporté')
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
    getRootProps: getMainImageRootProps,
    getInputProps: getMainImageInputProps,
    isDragActive: isMainImageDragActive,
  } = useDropzone({
    onDrop: handleMainImageDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    },
    maxFiles: 1,
    multiple: false,
    noClick: false,
    noKeyboard: false,
  })

  const handleRemoveMainImage = () => {
    setImageFile(null)
    setImagePreview('')
    if (imageInputRef.current) {
      imageInputRef.current.value = ''
    }
  }

  // -------------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------------
  const onSubmit = async (values: GalleryLjArtistFormValues) => {
    setIsSubmitting(true)
    try {
      let imageUrl: string | undefined

      // Upload image if a new file was selected
      if (imageFile) {
        setUploadingImage(true)
        // Constituer le nom de l'artiste : firstName + lastName si renseignés, sinon pseudo
        const artistFolderName = (values.firstName && values.lastName)
          ? normalizeString(`${values.firstName} ${values.lastName}`)
          : normalizeString(values.pseudo || 'artiste-sans-nom')
        const fileName = 'main-image'
        imageUrl = await uploadGalleryLjArtistImage(imageFile, artistFolderName, fileName)
        setUploadingImage(false)
      }

      if (mode === 'create') {
        const result = await createGalleryLjArtist({
          pseudo: values.pseudo,
          firstName: values.firstName || null,
          lastName: values.lastName || null,
          imageUrl: imageUrl ?? null,
          visible: values.visible
        })

        if (result.success) {
          success('Artiste créé avec succès')
          router.push('/fr/galleryLj/artists')
        } else {
          showError(result.message ?? 'Erreur lors de la création')
        }
      } else if (mode === 'edit' && artistId) {
        const updateData: Parameters<typeof updateGalleryLjArtist>[1] = {
          pseudo: values.pseudo,
          firstName: values.firstName || null,
          lastName: values.lastName || null,
          visible: values.visible
        }
        if (imageUrl !== undefined) {
          updateData.imageUrl = imageUrl
        }

        const result = await updateGalleryLjArtist(artistId, updateData)

        if (result.success) {
          success('Artiste mis à jour avec succès')
          router.push('/fr/galleryLj/artists')
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
    return <LoadingSpinner message="Chargement de l'artiste..." />
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form-container">
      <div className="form-card">
        <div className="card-content">
          {/* Pseudo */}
          <div className="form-group">
            <label htmlFor="pseudo" className="form-label">
              Pseudo
            </label>
            <input
              id="pseudo"
              type="text"
              className={`form-input ${errors.pseudo ? 'input-error' : ''}`}
              placeholder="Nom d'artiste"
              {...register('pseudo')}
            />
            {errors.pseudo && (
              <p className="form-error">{errors.pseudo.message}</p>
            )}
          </div>

          {/* Prénom */}
          <div className="form-group">
            <label htmlFor="firstName" className="form-label">
              Prénom
            </label>
            <input
              id="firstName"
              type="text"
              className="form-input"
              placeholder="Prénom"
              {...register('firstName')}
            />
          </div>

          {/* Nom */}
          <div className="form-group">
            <label htmlFor="lastName" className="form-label">
              Nom
            </label>
            <input
              id="lastName"
              type="text"
              className="form-input"
              placeholder="Nom de famille"
              {...register('lastName')}
            />
          </div>

          {/* Image upload */}
          <div className="form-group">
            <label className="form-label">Photo / Portrait</label>
            {!imagePreview ? (
              <div className="mb-3">
                <div
                  {...getMainImageRootProps()}
                  style={{
                    border: `2px dashed ${isMainImageDragActive ? '#4dabf7' : '#ccc'}`,
                    borderRadius: '8px',
                    padding: '1.5rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: isMainImageDragActive ? '#f0f8ff' : '#fafafa',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <input {...getMainImageInputProps()} ref={imageInputRef} id="main-image-input" />
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      const input = document.getElementById('main-image-input') as HTMLInputElement
                      if (input) {
                        input.click()
                      }
                    }}
                  >
                    <Camera size={24} color="#666" />
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>
                      {isMainImageDragActive ? 'Déposez l\'image ici' : 'Cliquez ou glissez une image'}
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
                    onClick={handleRemoveMainImage}
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
            'Créer l\'artiste'
          ) : (
            'Enregistrer'
          )}
        </button>
      </div>
    </form>
  )
}
