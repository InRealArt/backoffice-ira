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
  createGalleryLjArtwork,
  updateGalleryLjArtwork,
  getGalleryLjArtworkById
} from '@/lib/actions/gallery-lj-artwork-actions'
import { getAllGalleryLjArtists } from '@/lib/actions/gallery-lj-artist-actions'
import { uploadGalleryLjArtworkImage } from '@/lib/r2/storage'
import { getImageUrlWithCacheBuster } from '@/lib/r2/url'
import { normalizeString } from '@/lib/utils'

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const galleryLjArtworkSchema = z.object({
  name: z.string().min(1, 'Le titre de l\'œuvre est obligatoire'),
  artistId: z.coerce
    .number({ invalid_type_error: 'Veuillez sélectionner un artiste' })
    .int('Veuillez sélectionner un artiste')
    .positive('Veuillez sélectionner un artiste')
    .refine((val) => !isNaN(val), { message: 'Veuillez sélectionner un artiste' }),
  price: z.string().optional(),
  dimensions: z.string().optional(),
  creationYear: z.string().optional(),
  visible: z.boolean().default(true)
})

type GalleryLjArtworkFormValues = z.infer<typeof galleryLjArtworkSchema>

// ---------------------------------------------------------------------------
// Artist select option type
// ---------------------------------------------------------------------------
interface ArtistOption {
  id: number
  pseudo: string
  firstName: string | null
  lastName: string | null
}

function getArtistLabel(artist: ArtistOption): string {
  if (artist.firstName && artist.lastName) {
    return `${artist.firstName} ${artist.lastName} (${artist.pseudo})`
  }
  return artist.pseudo
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
export interface GalleryLjArtworkFormProps {
  mode: 'create' | 'edit'
  artworkId?: number
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function GalleryLjArtworkForm({ mode, artworkId }: GalleryLjArtworkFormProps) {
  const router = useRouter()
  const params = useParams()
  const locale = (params.locale as string) || 'fr'
  const { success, error: showError } = useToast()

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(mode === 'edit')
  const [imagePreview, setImagePreview] = useState<string>('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [artists, setArtists] = useState<ArtistOption[]>([])
  const [loadingArtists, setLoadingArtists] = useState(true)

  const imageInputRef = useRef<HTMLInputElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<GalleryLjArtworkFormValues>({
    resolver: zodResolver(galleryLjArtworkSchema),
    defaultValues: {
      name: '',
      artistId: undefined,
      price: '',
      dimensions: '',
      creationYear: '',
      visible: true
    }
  })

  // -------------------------------------------------------------------------
  // Load artists list for select
  // -------------------------------------------------------------------------
  useEffect(() => {
    const fetchArtists = async () => {
      setLoadingArtists(true)
      try {
        const data = await getAllGalleryLjArtists()
        setArtists(data.map((a) => ({
          id: a.id,
          pseudo: a.pseudo,
          firstName: a.firstName,
          lastName: a.lastName
        })))
      } catch {
        showError('Erreur lors du chargement des artistes')
      } finally {
        setLoadingArtists(false)
      }
    }
    fetchArtists()
  }, [showError])

  // -------------------------------------------------------------------------
  // Load existing artwork in edit mode
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (mode !== 'edit' || !artworkId) return

    const fetchArtwork = async () => {
      setIsLoading(true)
      try {
        const artwork = await getGalleryLjArtworkById(artworkId)
        if (artwork) {
          setValue('name', artwork.name)
          setValue('artistId', artwork.artistId)
          setValue('price', artwork.price != null ? String(artwork.price) : '')
          setValue('dimensions', artwork.dimensions ?? '')
          setValue('creationYear', artwork.creationYear != null ? String(artwork.creationYear) : '')
          setValue('visible', artwork.visible)
          if (artwork.imageUrl) {
            setImagePreview(getImageUrlWithCacheBuster(artwork.imageUrl) ?? '')
          }
        }
      } catch {
        showError("Erreur lors du chargement de l'œuvre")
      } finally {
        setIsLoading(false)
      }
    }

    fetchArtwork()
  }, [mode, artworkId, setValue, showError])

  const handleCancel = () => {
    if (window.history.length > 1) {
      router.back()
    } else {
      router.push(`/${locale}/galleryLj/artworks`)
    }
  }

  // -------------------------------------------------------------------------
  // Validation error handler — fired by react-hook-form when Zod validation fails
  // -------------------------------------------------------------------------
  const onInvalid = useCallback((fieldErrors: FieldErrors<GalleryLjArtworkFormValues>) => {
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
  const onSubmit = async (values: GalleryLjArtworkFormValues) => {
    setIsSubmitting(true)
    try {
      let imageUrl: string | undefined

      // Upload image if a new file was selected
      if (imageFile) {
        setUploadingImage(true)

        // Build artist slug for the R2 path
        const selectedArtist = artists.find((a) => a.id === values.artistId)
        const artistSlugSource = selectedArtist
          ? (selectedArtist.firstName && selectedArtist.lastName
              ? `${selectedArtist.firstName} ${selectedArtist.lastName}`
              : selectedArtist.pseudo)
          : 'artiste-inconnu'
        const artistSlug = normalizeString(artistSlugSource)
        const artworkSlug = normalizeString(values.name)

        imageUrl = await uploadGalleryLjArtworkImage(imageFile, artistSlug, artworkSlug)
        setUploadingImage(false)
      }

      // Parse optional numeric fields
      const price = values.price && values.price.trim() !== ''
        ? parseFloat(values.price.replace(',', '.'))
        : null
      const creationYear = values.creationYear && values.creationYear.trim() !== ''
        ? parseInt(values.creationYear, 10)
        : null

      if (mode === 'create') {
        if (!imageUrl) {
          showError('Une image est obligatoire pour créer une œuvre')
          return
        }

        const result = await createGalleryLjArtwork({
          name: values.name,
          artistId: values.artistId,
          imageUrl,
          price: price != null && !isNaN(price) ? price : null,
          dimensions: values.dimensions?.trim() || null,
          creationYear: creationYear != null && !isNaN(creationYear) ? creationYear : null,
          visible: values.visible
        })

        if (result.success) {
          success('Œuvre créée avec succès')
          router.push(`/${locale}/galleryLj/artworks`)
        } else {
          showError(result.message ?? 'Erreur lors de la création')
        }
      } else if (mode === 'edit' && artworkId) {
        const updateData: Parameters<typeof updateGalleryLjArtwork>[1] = {
          name: values.name,
          artistId: values.artistId,
          price: price != null && !isNaN(price) ? price : null,
          dimensions: values.dimensions?.trim() || null,
          creationYear: creationYear != null && !isNaN(creationYear) ? creationYear : null,
          visible: values.visible
        }
        if (imageUrl !== undefined) {
          updateData.imageUrl = imageUrl
        }

        const result = await updateGalleryLjArtwork(artworkId, updateData)

        if (result.success) {
          success('Œuvre mise à jour avec succès')
          router.push(`/${locale}/galleryLj/artworks`)
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
  if (isLoading || loadingArtists) {
    return <LoadingSpinner message="Chargement..." />
  }

  return (
    <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="form-container">
      <div className="form-card">
        <div className="card-content">

          {/* Titre */}
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Titre <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              className={`form-input ${errors.name ? 'input-error' : ''}`}
              placeholder="Titre de l'œuvre"
              {...register('name')}
            />
            {errors.name && (
              <p className="form-error">{errors.name.message}</p>
            )}
          </div>

          {/* Artiste */}
          <div className="form-group">
            <label htmlFor="artistId" className="form-label">
              Artiste <span className="text-red-500">*</span>
            </label>
            <select
              id="artistId"
              className={`form-input ${errors.artistId ? 'input-error' : ''}`}
              {...register('artistId')}
            >
              <option value="">-- Sélectionner un artiste --</option>
              {artists.map((artist) => (
                <option key={artist.id} value={artist.id}>
                  {getArtistLabel(artist)}
                </option>
              ))}
            </select>
            {errors.artistId && (
              <p className="form-error">{errors.artistId.message}</p>
            )}
          </div>

          {/* Prix */}
          <div className="form-group">
            <label htmlFor="price" className="form-label">
              Prix (€)
            </label>
            <input
              id="price"
              type="text"
              inputMode="decimal"
              className="form-input"
              placeholder="ex: 1200.00"
              {...register('price')}
            />
          </div>

          {/* Dimensions */}
          <div className="form-group">
            <label htmlFor="dimensions" className="form-label">
              Dimensions
            </label>
            <input
              id="dimensions"
              type="text"
              className="form-input"
              placeholder="ex: 50x70cm"
              {...register('dimensions')}
            />
          </div>

          {/* Année de création */}
          <div className="form-group">
            <label htmlFor="creationYear" className="form-label">
              Année de création
            </label>
            <input
              id="creationYear"
              type="number"
              className="form-input"
              placeholder="ex: 2023"
              min={1900}
              max={new Date().getFullYear() + 1}
              {...register('creationYear')}
            />
          </div>

          {/* Image upload */}
          <div className="form-group">
            <label className="form-label">
              Image {mode === 'create' && <span className="text-red-500">*</span>}
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
                  <input {...getImageInputProps()} ref={imageInputRef} id="artwork-image-input" />
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                    onClick={(e) => {
                      e.stopPropagation()
                      const input = document.getElementById('artwork-image-input') as HTMLInputElement
                      if (input) {
                        input.click()
                      }
                    }}
                  >
                    <Camera size={24} color="#666" />
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>
                      {isImageDragActive ? 'Déposez l\'image ici' : 'Cliquez ou glissez une image'}
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
            'Créer l\'œuvre'
          ) : (
            'Enregistrer'
          )}
        </button>
      </div>
    </form>
  )
}
