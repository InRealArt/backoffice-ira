'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Image from 'next/image'
import { Camera, X } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { AgencyEvent } from '@/src/generated/prisma/browser'
import { createAgencyEvent, updateAgencyEvent } from '@/lib/actions/agency-event-actions'
import { handleEntityTranslations } from '@/lib/actions/translation-actions'
import { useToast } from '@/app/components/Toast/ToastContext'
import TranslationField from '@/app/components/TranslationField'
import { uploadImageToAgencyEventFolder, deleteImageFromFirebase, LANDING_IMAGE_MAX_SIZE_BYTES } from '@/lib/r2/storage'
import { getImageUrl, getImageUrlWithCacheBuster } from '@/lib/r2/url'
import { normalizeString } from '@/lib/utils'

const formSchema = z.object({
  name: z.string().min(1, 'Le nom est requis'),
  imageUrl: z.string().nullable().optional(),
  description: z.string().min(1, 'La description est requise'),
  linkToEvent: z.string().url("URL de l'événement invalide").regex(/^https?:\/\//i, 'Le lien doit commencer par http:// ou https://').nullable().optional().or(z.literal('')),
  isFeatured: z.boolean().optional().default(false),
})

type FormValues = z.infer<typeof formSchema>

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

interface AgencyEventFormProps {
  mode: 'create' | 'edit'
  agencyEvent?: AgencyEvent
}

export default function AgencyEventForm({ mode, agencyEvent }: AgencyEventFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>(
    getImageUrl(agencyEvent?.imageUrl) ?? ''
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
      name: agencyEvent?.name ?? '',
      imageUrl: agencyEvent?.imageUrl ?? '',
      description: agencyEvent?.description ?? '',
      linkToEvent: agencyEvent?.linkToEvent ?? '',
      isFeatured: agencyEvent?.isFeatured ?? false,
    },
  })

  const nameValue = watch('name')
  const isFeatured = watch('isFeatured')

  const handleImageDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
      if (!validTypes.includes(file.type)) {
        showError('Format non supporté. Utilisez JPG, PNG, GIF ou WebP.')
        return
      }

      if (file.size > LANDING_IMAGE_MAX_SIZE_BYTES) {
        showError("L'image ne doit pas dépasser 4 Mo.")
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

  // Supprime de R2 une image uploadée dont l'enregistrement en base a échoué.
  // Ne touche jamais à l'image actuellement enregistrée (même clé R2 si le nom n'a pas changé).
  const cleanupUploadedImage = async (uploadedImageUrl: string | null) => {
    if (!uploadedImageUrl || uploadedImageUrl === agencyEvent?.imageUrl) return
    try {
      await deleteImageFromFirebase(uploadedImageUrl)
    } catch (cleanupError) {
      console.error("Erreur lors du nettoyage de l'image orpheline:", cleanupError)
    }
  }

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    // Image uploadée pendant cette soumission, à nettoyer de R2 si l'enregistrement échoue
    let uploadedImageUrl: string | null = null
    try {
      let finalImageUrl = data.imageUrl || null

      // Upload de la nouvelle image si un fichier est sélectionné
      if (imageFile) {
        // Nom normalisé pour éviter les caractères spéciaux / sous-dossiers dans la clé R2
        const eventFolder = normalizeString(data.name) || `agency-event-${Date.now()}`
        const fileName = normalizeString(data.name) || `image-${Date.now()}`

        finalImageUrl = await uploadImageToAgencyEventFolder(
          imageFile,
          eventFolder,
          fileName
        )
        uploadedImageUrl = finalImageUrl
      }

      const payload = {
        name: data.name,
        imageUrl: finalImageUrl,
        description: data.description,
        linkToEvent: data.linkToEvent || null,
        isFeatured: data.isFeatured ?? false,
      }

      let result: { success: boolean; message?: string }
      let agencyEventId: number | undefined

      if (mode === 'create') {
        const createResult = await createAgencyEvent(payload)
        result = createResult
        agencyEventId = createResult.id
      } else {
        result = await updateAgencyEvent(agencyEvent!.id, payload)
        agencyEventId = agencyEvent!.id
      }

      if (result.success) {
        if (uploadedImageUrl) setValue('imageUrl', uploadedImageUrl)
        // Gestion des traductions pour le nom et la description
        if (agencyEventId) {
          try {
            await handleEntityTranslations('AgencyEvent', agencyEventId, {
              name: payload.name,
              description: payload.description,
            })
          } catch (translationError) {
            console.error('Erreur lors de la gestion des traductions:', translationError)
            // On ne bloque pas la sauvegarde en cas d'erreur de traduction
          }
        }

        success(
          mode === 'create'
            ? 'Événement créé avec succès'
            : 'Événement mis à jour avec succès'
        )
        setTimeout(() => {
          router.push('/landing/agency-events')
          router.refresh()
        }, 800)
      } else {
        await cleanupUploadedImage(uploadedImageUrl)
        showError(result.message || 'Une erreur est survenue')
      }
    } catch (err) {
      console.error(err)
      await cleanupUploadedImage(uploadedImageUrl)
      showError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/landing/agency-events')
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form-container">
      {/* Informations générales */}
      <div className="form-card">
        <div className="card-header">
          <h2 className="card-title">Informations générales</h2>
        </div>
        <div className="card-content">
          <TranslationField
            entityType="AgencyEvent"
            entityId={agencyEvent?.id ?? null}
            field="name"
            label="Nom de l'événement"
            required
            errorMessage={errors.name?.message}
          >
            <input
              id="name"
              type="text"
              {...register('name')}
              className={`form-input ${errors.name ? 'input-error' : ''}`}
              placeholder="Ex: Vernissage InRealArt Printemps 2026"
              disabled={isSubmitting}
            />
          </TranslationField>
        </div>
      </div>

      {/* Image */}
      <div className="form-card">
        <div className="card-header">
          <h2 className="card-title">Image</h2>
        </div>
        <div className="card-content">
          <div className="form-group">
            <label className="form-label">Image de l&apos;événement</label>
            <p className="form-hint text-xs text-gray-500 mb-2">
              Sera stockée dans <code>agency-events/{normalizeString(nameValue || '') || 'Nom événement'}/</code> sur Cloudflare R2
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
                    JPG, PNG, GIF, WebP — max 4 Mo
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
                      alt="Aperçu événement"
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    <Image
                      src={getImageUrlWithCacheBuster(imagePreview) ?? imagePreview}
                      alt="Aperçu événement"
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
          <TranslationField
            entityType="AgencyEvent"
            entityId={agencyEvent?.id ?? null}
            field="description"
            label="Description"
            required
            errorMessage={errors.description?.message}
          >
            <textarea
              id="description"
              {...register('description')}
              className={`form-input ${errors.description ? 'input-error' : ''}`}
              rows={4}
              placeholder="Décrivez l'événement..."
              disabled={isSubmitting}
            />
          </TranslationField>

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

      {/* Mise en avant */}
      <div className="form-card">
        <div className="card-content">
          <div className="form-group">
            <div className="d-flex align-items-center gap-md">
              <span
                className={
                  !isFeatured ? "text-primary" : "text-muted"
                }
                style={{
                  fontWeight: !isFeatured ? "bold" : "normal",
                }}
              >
                Non
              </span>
              <label
                className="d-flex align-items-center"
                style={{
                  position: "relative",
                  display: "inline-block",
                  width: "60px",
                  height: "30px",
                }}
              >
                <input
                  type="checkbox"
                  {...register("isFeatured")}
                  disabled={isSubmitting}
                  style={{ opacity: 0, width: 0, height: 0 }}
                />
                <span
                  style={{
                    position: "absolute",
                    cursor: "pointer",
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: isFeatured ? "#4f46e5" : "#ccc",
                    borderRadius: "34px",
                    transition: "0.4s",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      content: '""',
                      height: "22px",
                      width: "22px",
                      left: "4px",
                      bottom: "4px",
                      backgroundColor: "white",
                      borderRadius: "50%",
                      transition: "0.4s",
                      transform: isFeatured
                        ? "translateX(30px)"
                        : "translateX(0)",
                    }}
                  ></span>
                </span>
              </label>
              <span
                className={
                  isFeatured ? "text-primary" : "text-muted"
                }
                style={{
                  fontWeight: isFeatured ? "bold" : "normal",
                }}
              >
                Mis en avant
              </span>
            </div>
            <p className="form-hint mt-1 text-xs text-gray-500 dark:text-gray-400">
              Activer pour mettre cet événement en avant (plusieurs événements peuvent l'être simultanément)
            </p>
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
            ? "Créer l'événement"
            : 'Mettre à jour'}
        </button>
      </div>
    </form>
  )
}
