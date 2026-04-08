'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Image from 'next/image'
import { Camera, X } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { Exhibition } from '@/src/generated/prisma/browser'
import { createExhibition, updateExhibition } from '@/lib/actions/exhibition-actions'
import { useToast } from '@/app/components/Toast/ToastContext'
import { uploadImageToExhibitionFolder } from '@/lib/r2/storage'
import { getImageUrlWithCacheBuster } from '@/lib/r2/url'
import { normalizeString } from '@/lib/utils'

const formSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  startDate: z.string().min(1, 'La date de début est requise'),
  endDate: z.string().min(1, 'La date de fin est requise'),
  address: z.string().min(1, "L'adresse est requise"),
  imageUrl: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  linkToEvent: z.string().url("URL de l'événement invalide").nullable().optional().or(z.literal('')),
})

type FormValues = z.infer<typeof formSchema>

function toDateInputValue(date: Date): string {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const ALLOWED_HOSTNAMES = [
  'pub-d7df68395d644bd3bc80d24168d6d8be.r2.dev',
  'images.inrealart.com',
  'firebasestorage.googleapis.com',
]

function isValidRemoteImageUrl(url: string): boolean {
  if (url.startsWith('data:') || url.startsWith('blob:')) return false
  try {
    const parsed = new URL(url)
    return ALLOWED_HOSTNAMES.some(
      (h) => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`)
    )
  } catch {
    return false
  }
}

interface ExhibitionFormProps {
  mode: 'create' | 'edit'
  exhibition?: Exhibition
}

export default function ExhibitionForm({ mode, exhibition }: ExhibitionFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>(
    exhibition?.imageUrl ?? ''
  )
  const { success, error: showError } = useToast()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: exhibition?.name ?? '',
      startDate: exhibition ? toDateInputValue(exhibition.startDate) : '',
      endDate: exhibition ? toDateInputValue(exhibition.endDate) : '',
      address: exhibition?.address ?? '',
      imageUrl: exhibition?.imageUrl ?? '',
      description: exhibition?.description ?? '',
      linkToEvent: exhibition?.linkToEvent ?? '',
    },
  })

  const nameValue = watch('name')

  const handleImageDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!validTypes.includes(file.type)) {
        showError('Format non supporté. Utilisez JPG, PNG, GIF ou WebP.')
        return
      }

      const maxSize = 10 * 1024 * 1024 // 10MB
      if (file.size > maxSize) {
        showError("L'image ne doit pas dépasser 10MB.")
        return
      }

      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    },
    [showError]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: handleImageDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    maxFiles: 1,
    multiple: false,
  })

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview('')
    setValue('imageUrl', '')
  }

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    try {
      let finalImageUrl = data.imageUrl || null

      // Upload de la nouvelle image si un fichier est sélectionné
      if (imageFile) {
        const exhibitionFolder = data.name || `exhibition-${Date.now()}`
        const fileName = normalizeString(data.name || `image-${Date.now()}`)

        finalImageUrl = await uploadImageToExhibitionFolder(
          imageFile,
          exhibitionFolder,
          fileName
        )
        setValue('imageUrl', finalImageUrl)
      }

      const payload = {
        name: data.name,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        address: data.address,
        imageUrl: finalImageUrl,
        description: data.description || null,
        linkToEvent: data.linkToEvent || null,
      }

      let result: { success: boolean; message?: string }

      if (mode === 'create') {
        result = await createExhibition(payload)
      } else {
        result = await updateExhibition(exhibition!.id, payload)
      }

      if (result.success) {
        success(
          mode === 'create'
            ? 'Exposition créée avec succès'
            : 'Exposition mise à jour avec succès'
        )
        setTimeout(() => {
          router.push('/landing/exhibitions')
          router.refresh()
        }, 800)
      } else {
        showError(result.message || 'Une erreur est survenue')
      }
    } catch (err: any) {
      console.error(err)
      showError(err.message || 'Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/landing/exhibitions')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form-container">
      {/* Informations générales */}
      <div className="form-card">
        <div className="card-header">
          <h2 className="card-title">Informations générales</h2>
        </div>
        <div className="card-content">
          <div className="form-group">
            <label htmlFor="name" className="form-label">
              Nom de l&apos;exposition <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              {...register('name')}
              className={`form-input ${errors.name ? 'input-error' : ''}`}
              placeholder="Ex: Exposition Printanière 2025"
              disabled={isSubmitting}
            />
            {errors.name && <p className="form-error">{errors.name.message}</p>}
          </div>

          <div className="d-flex gap-md">
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="startDate" className="form-label">
                Date de début <span className="text-red-500">*</span>
              </label>
              <input
                id="startDate"
                type="date"
                {...register('startDate')}
                className={`form-input ${errors.startDate ? 'input-error' : ''}`}
                disabled={isSubmitting}
              />
              {errors.startDate && <p className="form-error">{errors.startDate.message}</p>}
            </div>

            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="endDate" className="form-label">
                Date de fin <span className="text-red-500">*</span>
              </label>
              <input
                id="endDate"
                type="date"
                {...register('endDate')}
                className={`form-input ${errors.endDate ? 'input-error' : ''}`}
                disabled={isSubmitting}
              />
              {errors.endDate && <p className="form-error">{errors.endDate.message}</p>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="address" className="form-label">
              Adresse <span className="text-red-500">*</span>
            </label>
            <input
              id="address"
              type="text"
              {...register('address')}
              className={`form-input ${errors.address ? 'input-error' : ''}`}
              placeholder="Ex: 10 rue de la Paix, 75001 Paris"
              disabled={isSubmitting}
            />
            {errors.address && <p className="form-error">{errors.address.message}</p>}
          </div>
        </div>
      </div>

      {/* Image */}
      <div className="form-card">
        <div className="card-header">
          <h2 className="card-title">Image</h2>
        </div>
        <div className="card-content">
          <div className="form-group">
            <label className="form-label">Image de l&apos;exposition</label>
            <p className="form-hint text-xs text-gray-500 mb-2">
              Sera stockée dans <code>exhibitions/{nameValue || 'Nom exposition'}/</code> sur Cloudflare R2
            </p>

            {!imagePreview ? (
              <div
                {...getRootProps()}
                style={{
                  border: `2px dashed ${isDragActive ? '#4dabf7' : '#ccc'}`,
                  borderRadius: '8px',
                  padding: '1.5rem',
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: isDragActive ? '#f0f8ff' : '#fafafa',
                  transition: 'all 0.2s ease',
                }}
              >
                <input {...getInputProps()} id="image-input" />
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
                    {isDragActive ? 'Déposez l\'image ici' : 'Cliquez ou glissez une image'}
                  </p>
                  <p style={{ margin: 0, fontSize: '0.75rem', color: '#666' }}>
                    JPG, PNG, GIF, WebP — max 10MB
                  </p>
                </div>
              </div>
            ) : null}

            {/* Champ caché pour la valeur en base */}
            <input id="imageUrl" type="hidden" {...register('imageUrl')} />

            {imagePreview && (
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', marginTop: '1rem' }}>
                <div
                  style={{
                    position: 'relative',
                    width: '200px',
                    height: '200px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    flexShrink: 0,
                  }}
                >
                  {imagePreview.startsWith('data:') || !isValidRemoteImageUrl(imagePreview) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imagePreview}
                      alt="Aperçu exposition"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Image
                      src={getImageUrlWithCacheBuster(imagePreview) ?? imagePreview}
                      alt="Aperçu exposition"
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  )}
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
                    disabled={isSubmitting}
                  >
                    <X size={14} style={{ display: 'inline', marginRight: '2px' }} />
                    Supprimer
                  </button>
                </div>

                {/* Zone de remplacement */}
                <div
                  {...getRootProps()}
                  style={{
                    border: `2px dashed ${isDragActive ? '#4dabf7' : '#ccc'}`,
                    borderRadius: '8px',
                    padding: '1rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: isDragActive ? '#f0f8ff' : '#fafafa',
                    flex: 1,
                  }}
                >
                  <input {...getInputProps()} />
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                    <Camera size={20} color="#666" />
                    <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600 }}>
                      {isDragActive ? 'Déposez ici' : 'Changer l\'image'}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Détails */}
      <div className="form-card">
        <div className="card-header">
          <h2 className="card-title">Détails</h2>
        </div>
        <div className="card-content">
          <div className="form-group">
            <label htmlFor="description" className="form-label">
              Description
            </label>
            <textarea
              id="description"
              {...register('description')}
              className={`form-input ${errors.description ? 'input-error' : ''}`}
              rows={4}
              placeholder="Décrivez l'exposition..."
              disabled={isSubmitting}
            />
            {errors.description && <p className="form-error">{errors.description.message}</p>}
          </div>

          <div className="form-group">
            <label htmlFor="linkToEvent" className="form-label">
              Lien vers l&apos;événement
            </label>
            <input
              id="linkToEvent"
              type="text"
              {...register('linkToEvent')}
              className={`form-input ${errors.linkToEvent ? 'input-error' : ''}`}
              placeholder="https://example.com/evenement"
              disabled={isSubmitting}
            />
            {errors.linkToEvent && <p className="form-error">{errors.linkToEvent.message}</p>}
          </div>
        </div>
      </div>

      <div className="d-flex gap-md justify-end">
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
          {isSubmitting
            ? mode === 'create'
              ? 'Création...'
              : 'Mise à jour...'
            : mode === 'create'
            ? "Créer l'exposition"
            : 'Mettre à jour'}
        </button>
      </div>
    </form>
  )
}
