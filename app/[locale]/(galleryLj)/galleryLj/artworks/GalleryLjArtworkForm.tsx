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
  getGalleryLjArtworkById,
  deleteGalleryLjArtworkSecondaryImage
} from '@/lib/actions/gallery-lj-artwork-actions'
import { getAllGalleryLjArtists } from '@/lib/actions/gallery-lj-artist-actions'
import { uploadGalleryLjArtworkImage, uploadGalleryLjArtworkSecondaryImage } from '@/lib/r2/storage'
import { getImageUrlWithCacheBuster } from '@/lib/r2/url'
import { normalizeString } from '@/lib/utils'
import TiptapEditor from '@/app/components/Forms/TiptapEditor'

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
  description: z.string().optional(),
  visible: z.boolean().default(true)
})

type GalleryLjArtworkFormValues = z.infer<typeof galleryLjArtworkSchema>

type ActiveTab = 'principal' | 'images'

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

  const [activeTab, setActiveTab] = useState<ActiveTab>('principal')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(mode === 'edit')
  const [imagePreview, setImagePreview] = useState<string>('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [artists, setArtists] = useState<ArtistOption[]>([])
  const [loadingArtists, setLoadingArtists] = useState(true)

  // Secondary images state
  const [existingImages, setExistingImages] = useState<string[]>([])
  const [newImageFiles, setNewImageFiles] = useState<File[]>([])
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([])
  const [deletingImageIndex, setDeletingImageIndex] = useState<number | null>(null)

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
      description: '',
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
          setValue('description', artwork.description ?? '')
          setValue('visible', artwork.visible)
          if (artwork.imageUrl) {
            setImagePreview(getImageUrlWithCacheBuster(artwork.imageUrl) ?? '')
          }
          if (artwork.images && artwork.images.length > 0) {
            setExistingImages(artwork.images)
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
  // Primary image upload via dropzone
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
  // Secondary images dropzone
  // -------------------------------------------------------------------------
  const handleSecondaryImagesDrop = useCallback((acceptedFiles: File[]) => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
    const maxSize = 10 * 1024 * 1024

    const validFiles = acceptedFiles.filter((file) => {
      if (!validTypes.includes(file.type)) {
        showError(`Format non supporté : ${file.name}`)
        return false
      }
      if (file.size > maxSize) {
        showError(`Image trop volumineuse (max 10MB) : ${file.name}`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    setNewImageFiles((prev) => [...prev, ...validFiles])

    validFiles.forEach((file) => {
      const reader = new FileReader()
      reader.onloadend = () => {
        setNewImagePreviews((prev) => [...prev, reader.result as string])
      }
      reader.readAsDataURL(file)
    })
  }, [showError])

  const {
    getRootProps: getSecondaryRootProps,
    getInputProps: getSecondaryInputProps,
    isDragActive: isSecondaryDragActive,
  } = useDropzone({
    onDrop: handleSecondaryImagesDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    },
    multiple: true,
    noClick: false,
    noKeyboard: false,
  })

  const handleRemoveExistingImage = async (index: number) => {
    // En mode create : pas d'image persistée, on retire simplement de l'état local
    if (mode !== 'edit' || !artworkId) {
      setExistingImages((prev) => prev.filter((_, i) => i !== index))
      return
    }

    // En mode edit : suppression réelle dans R2 + DB via server action
    const imageUrl = existingImages[index]
    setDeletingImageIndex(index)
    try {
      const result = await deleteGalleryLjArtworkSecondaryImage(artworkId, imageUrl)
      if (result.success) {
        setExistingImages((prev) => prev.filter((_, i) => i !== index))
      } else {
        showError(result.message ?? 'Erreur lors de la suppression de l\'image')
      }
    } catch {
      showError('Erreur inattendue lors de la suppression de l\'image')
    } finally {
      setDeletingImageIndex(null)
    }
  }

  const handleRemoveNewImage = (index: number) => {
    setNewImageFiles((prev) => prev.filter((_, i) => i !== index))
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index))
  }

  // -------------------------------------------------------------------------
  // Submit
  // -------------------------------------------------------------------------
  const onSubmit = async (values: GalleryLjArtworkFormValues) => {
    setIsSubmitting(true)
    try {
      // Build slugs — needed for both primary and secondary image paths
      const selectedArtist = artists.find((a) => a.id === values.artistId)
      const artistSlugSource = selectedArtist
        ? (selectedArtist.firstName && selectedArtist.lastName
            ? `${selectedArtist.firstName} ${selectedArtist.lastName}`
            : selectedArtist.pseudo)
        : 'artiste-inconnu'
      const artistSlug = normalizeString(artistSlugSource)
      const artworkSlug = normalizeString(values.name)

      let imageUrl: string | undefined

      // Upload primary image if a new file was selected
      if (imageFile) {
        setUploadingImage(true)
        imageUrl = await uploadGalleryLjArtworkImage(imageFile, artistSlug, artworkSlug)
        setUploadingImage(false)
      }

      // Upload secondary images
      const uploadedSecondaryUrls: string[] = []
      for (const file of newImageFiles) {
        const url = await uploadGalleryLjArtworkSecondaryImage(file, artistSlug, artworkSlug)
        uploadedSecondaryUrls.push(url)
      }
      const finalImages = [...existingImages, ...uploadedSecondaryUrls]

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
          description: values.description?.trim() || null,
          visible: values.visible,
          images: finalImages
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
          description: values.description?.trim() || null,
          visible: values.visible,
          images: finalImages
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
        {/* Tab bar */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            type="button"
            onClick={() => setActiveTab('principal')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'principal'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Principal
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('images')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'images'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Autres Images
            {(existingImages.length + newImageFiles.length) > 0 && (
              <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 rounded-full">
                {existingImages.length + newImageFiles.length}
              </span>
            )}
          </button>
        </div>

        <div className="card-content">

          {/* ---- Onglet Principal ---- */}
          {activeTab === 'principal' && (
            <>
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

              {/* Description */}
              <div className="form-group">
                <label className="form-label">
                  Description
                </label>
                <TiptapEditor
                  value={watch('description') ?? ''}
                  onChange={(html) => setValue('description', html, { shouldDirty: true })}
                  placeholder=""
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

              {/* Image principale */}
              <div className="form-group">
                <label className="form-label">
                  Image principale {mode === 'create' && <span className="text-red-500">*</span>}
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
            </>
          )}

          {/* ---- Onglet Autres Images ---- */}
          {activeTab === 'images' && (
            <div>
              <p className="text-sm text-gray-500 mb-4">
                Ajoutez des images secondaires pour cette œuvre. Elles seront converties en WebP automatiquement.
              </p>

              {/* Dropzone secondaire */}
              <div
                {...getSecondaryRootProps()}
                style={{
                  border: `2px dashed ${isSecondaryDragActive ? '#4dabf7' : '#ccc'}`,
                  borderRadius: '8px',
                  padding: '1.5rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: isSecondaryDragActive ? '#f0f8ff' : '#fafafa',
                  transition: 'all 0.2s ease',
                  marginBottom: '1.5rem',
                }}
              >
                <input {...getSecondaryInputProps()} />
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Camera size={24} color="#666" />
                  <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600 }}>
                    {isSecondaryDragActive ? 'Déposez les images ici' : 'Cliquez ou glissez plusieurs images'}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#666' }}>
                    JPG, PNG, WebP, GIF — converties en WebP automatiquement
                  </p>
                </div>
              </div>

              {/* Images existantes (depuis la DB) */}
              {existingImages.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Images enregistrées ({existingImages.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {existingImages.map((url, index) => (
                      <div
                        key={`existing-${index}`}
                        style={{
                          position: 'relative',
                          width: '200px',
                          height: '200px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          flexShrink: 0,
                        }}
                      >
                        <Image
                          src={getImageUrlWithCacheBuster(url) ?? url}
                          alt={`Image secondaire ${index + 1}`}
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingImage(index)}
                          disabled={isSubmitting || deletingImageIndex !== null}
                          style={{
                            position: 'absolute',
                            top: '6px',
                            right: '6px',
                            background: deletingImageIndex === index
                              ? 'rgba(220, 38, 38, 0.85)'
                              : 'rgba(0, 0, 0, 0.7)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: deletingImageIndex !== null ? 'not-allowed' : 'pointer',
                            zIndex: 10,
                          }}
                          title={deletingImageIndex === index ? 'Suppression en cours...' : 'Supprimer cette image'}
                        >
                          {deletingImageIndex === index ? (
                            <LoadingSpinner size="small" message="" inline />
                          ) : (
                            <X size={14} />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Nouvelles images (aperçus avant upload) */}
              {newImageFiles.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">
                    Nouvelles images à uploader ({newImageFiles.length})
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {newImagePreviews.map((preview, index) => (
                      <div
                        key={`new-${index}`}
                        style={{
                          position: 'relative',
                          width: '200px',
                          height: '200px',
                          borderRadius: '8px',
                          overflow: 'hidden',
                          flexShrink: 0,
                        }}
                      >
                        <Image
                          src={preview}
                          alt={`Nouvelle image ${index + 1}`}
                          fill
                          style={{ objectFit: 'cover' }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveNewImage(index)}
                          disabled={isSubmitting}
                          style={{
                            position: 'absolute',
                            top: '6px',
                            right: '6px',
                            background: 'rgba(220, 38, 38, 0.85)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '50%',
                            width: '24px',
                            height: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            zIndex: 10,
                          }}
                          title="Retirer cette image"
                        >
                          <X size={14} />
                        </button>
                        {/* Badge "Nouveau" */}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '6px',
                            left: '6px',
                            background: 'rgba(37, 99, 235, 0.85)',
                            color: 'white',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: 600,
                          }}
                        >
                          Nouveau
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {existingImages.length === 0 && newImageFiles.length === 0 && (
                <p className="text-sm text-gray-400 text-center py-6">
                  Aucune image secondaire pour l&apos;instant.
                </p>
              )}
            </div>
          )}

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
