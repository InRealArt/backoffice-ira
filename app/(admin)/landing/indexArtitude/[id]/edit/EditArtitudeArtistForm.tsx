'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/app/components/Toast/ToastContext'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  updateArtitudeArtistAction,
  geocodeAddressAction,
  type OpeningHoursPeriod,
} from '@/lib/actions/artitude-artist-actions'
import type { CountryRecord } from '@/lib/actions/country-actions'
import { validateUrl, getArtistFullName } from '@/lib/utils'
import type { ArtistName } from '@/lib/types/artist'
import ArtitudeMultiImageUpload from '../../ArtitudeMultiImageUpload'
import ProgressModal from '@/app/components/art/ProgressModal'
import OptionalImageUpload from '@/app/components/art/OptionalImageUpload'
import Tabs from '@/app/components/Tabs/Tabs'

const DAYS: { key: OpeningHoursPeriod['day']; label: string }[] = [
  { key: 'MONDAY', label: 'Lundi' },
  { key: 'TUESDAY', label: 'Mardi' },
  { key: 'WEDNESDAY', label: 'Mercredi' },
  { key: 'THURSDAY', label: 'Jeudi' },
  { key: 'FRIDAY', label: 'Vendredi' },
  { key: 'SATURDAY', label: 'Samedi' },
  { key: 'SUNDAY', label: 'Dimanche' },
]

const formSchema = z.object({
  addressLine1: z.string().min(1, "L'adresse est requise"),
  addressLine2: z.string().optional(),
  postalCode: z.string().min(1, 'Le code postal est requis'),
  city: z.string().min(1, 'La ville est requise'),
  countryCode: z.string().optional(),
  latitude: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Number(val)), { message: 'Latitude invalide' }),
  longitude: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Number(val)), { message: 'Longitude invalide' }),
  phoneNumber: z.string().optional(),
  websiteUrl: z
    .string()
    .refine(validateUrl, { message: 'URL invalide' })
    .optional()
    .transform((val) => (val === '' ? undefined : val)),
  googleBusinessProfileUrl: z
    .string()
    .min(1, 'Le lien de la fiche établissement Google est requis')
    .refine(validateUrl, { message: 'URL invalide' }),
})

type FormValues = z.infer<typeof formSchema>

interface DayHours {
  enabled: boolean
  openTime: string
  closeTime: string
}

interface ArtitudeArtistImagesData {
  coverImage: string | null
  interiorImages: string[]
  exteriorImages: string[]
  artistImages: string[]
  otherImages: string[]
}

interface ArtitudeArtistData {
  id: number
  artistId: number
  artist: ArtistName & { id: number }
  addressLine1: string
  addressLine2: string | null
  postalCode: string
  city: string
  countryCode: string | null
  latitude: number | null
  longitude: number | null
  phoneNumber: string | null
  websiteUrl: string | null
  googleBusinessProfileUrl: string
  openingHours: unknown
  images: ArtitudeArtistImagesData | null
}

interface EditArtitudeArtistFormProps {
  artitudeArtist: ArtitudeArtistData
  countries: CountryRecord[]
}

function buildInitialHours(openingHours: unknown): Record<OpeningHoursPeriod['day'], DayHours> {
  const parsed: OpeningHoursPeriod[] = Array.isArray(openingHours) ? (openingHours as OpeningHoursPeriod[]) : []
  return DAYS.reduce((acc, day) => {
    const existing = parsed.find((p) => p.day === day.key)
    acc[day.key] = existing
      ? { enabled: true, openTime: existing.openTime, closeTime: existing.closeTime }
      : { enabled: false, openTime: '10:00', closeTime: '17:00' }
    return acc
  }, {} as Record<OpeningHoursPeriod['day'], DayHours>)
}

export default function EditArtitudeArtistForm({
  artitudeArtist,
  countries,
}: EditArtitudeArtistFormProps) {
  const router = useRouter()
  const { success, error } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [activeTabId, setActiveTabId] = useState('info')

  const folderName = getArtistFullName(artitudeArtist.artist)

  const [coverFile, setCoverFile] = useState<File | null>(null)
  const [interiorFiles, setInteriorFiles] = useState<File[]>([])
  const [exteriorFiles, setExteriorFiles] = useState<File[]>([])
  const [artistFiles, setArtistFiles] = useState<File[]>([])
  const [otherFiles, setOtherFiles] = useState<File[]>([])

  const [existingCoverImage, setExistingCoverImage] = useState<string | null>(
    artitudeArtist.images?.coverImage ?? null
  )
  const [existingInteriorImages, setExistingInteriorImages] = useState<string[]>(
    artitudeArtist.images?.interiorImages ?? []
  )
  const [existingExteriorImages, setExistingExteriorImages] = useState<string[]>(
    artitudeArtist.images?.exteriorImages ?? []
  )
  const [existingArtistImages, setExistingArtistImages] = useState<string[]>(
    artitudeArtist.images?.artistImages ?? []
  )
  const [existingOtherImages, setExistingOtherImages] = useState<string[]>(
    artitudeArtist.images?.otherImages ?? []
  )

  const [hours, setHours] = useState<Record<OpeningHoursPeriod['day'], DayHours>>(() =>
    buildInitialHours(artitudeArtist.openingHours)
  )

  const [showProgressModal, setShowProgressModal] = useState(false)
  const [progressSteps, setProgressSteps] = useState<
    Array<{
      id: string
      label: string
      status: 'pending' | 'in-progress' | 'completed' | 'error'
    }>
  >([
    { id: 'validation', label: 'Validation des données', status: 'pending' },
    { id: 'upload', label: 'Conversion et upload des images', status: 'pending' },
    { id: 'update', label: 'Mise à jour de la fiche Artitude', status: 'pending' },
    { id: 'finalization', label: 'Finalisation', status: 'pending' },
  ])
  const [progressError, setProgressError] = useState<string | undefined>(undefined)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      addressLine1: artitudeArtist.addressLine1,
      addressLine2: artitudeArtist.addressLine2 ?? '',
      postalCode: artitudeArtist.postalCode,
      city: artitudeArtist.city,
      countryCode: artitudeArtist.countryCode ?? '',
      latitude: artitudeArtist.latitude?.toString() ?? '',
      longitude: artitudeArtist.longitude?.toString() ?? '',
      phoneNumber: artitudeArtist.phoneNumber ?? '',
      websiteUrl: artitudeArtist.websiteUrl ?? '',
      googleBusinessProfileUrl: artitudeArtist.googleBusinessProfileUrl,
    },
  })

  // Géocodage automatique de l'adresse (API BAN, gratuite) : dès que adresse/CP/ville
  // changent, on recalcule latitude/longitude après un court debounce. Si l'adresse ne
  // permet pas de trouver de coordonnées, les champs deviennent éditables manuellement.
  // On ignore le tout premier rendu pour ne pas écraser les coordonnées déjà enregistrées.
  const [geocodingStatus, setGeocodingStatus] = useState<'idle' | 'loading' | 'found' | 'not-found'>(
    artitudeArtist.latitude !== null && artitudeArtist.longitude !== null ? 'found' : 'idle'
  )
  const addressLine1 = watch('addressLine1')
  const postalCode = watch('postalCode')
  const city = watch('city')
  const geocodeDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const geocodeRequestIdRef = useRef(0)
  const isFirstRenderRef = useRef(true)

  useEffect(() => {
    if (isFirstRenderRef.current) {
      isFirstRenderRef.current = false
      return
    }

    if (geocodeDebounceRef.current) {
      clearTimeout(geocodeDebounceRef.current)
    }

    if (!addressLine1 || !postalCode || !city) {
      setGeocodingStatus('idle')
      setValue('latitude', '')
      setValue('longitude', '')
      return
    }

    geocodeDebounceRef.current = setTimeout(async () => {
      const requestId = ++geocodeRequestIdRef.current
      setGeocodingStatus('loading')
      const coordinates = await geocodeAddressAction(addressLine1, postalCode, city)
      // Ignore les réponses obsolètes si l'adresse a changé entre-temps
      if (requestId !== geocodeRequestIdRef.current) return

      if (coordinates) {
        setValue('latitude', coordinates.latitude.toString(), { shouldValidate: true })
        setValue('longitude', coordinates.longitude.toString(), { shouldValidate: true })
        setGeocodingStatus('found')
      } else {
        setValue('latitude', '')
        setValue('longitude', '')
        setGeocodingStatus('not-found')
      }
    }, 800)

    return () => {
      if (geocodeDebounceRef.current) {
        clearTimeout(geocodeDebounceRef.current)
      }
    }
  }, [addressLine1, postalCode, city, setValue])

  const updateStepStatus = (
    stepId: string,
    status: 'pending' | 'in-progress' | 'completed' | 'error'
  ) => {
    setProgressSteps((prev) =>
      prev.map((step) => (step.id === stepId ? { ...step, status } : step))
    )
  }

  const toggleDay = (day: OpeningHoursPeriod['day']) => {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], enabled: !prev[day].enabled } }))
  }

  const updateDayTime = (
    day: OpeningHoursPeriod['day'],
    field: 'openTime' | 'closeTime',
    value: string
  ) => {
    setHours((prev) => ({ ...prev, [day]: { ...prev[day], [field]: value } }))
  }

  const uploadCategory = async (
    files: File[],
    category: 'interior' | 'exterior' | 'artist' | 'others'
  ): Promise<string[]> => {
    const { uploadArtitudeArtistImage } = await import('@/lib/r2/storage')
    const results: string[] = []
    for (const file of files) {
      const fileName = file.name.replace(/\.[^/.]+$/, '') || category
      const path = await uploadArtitudeArtistImage(
        file,
        folderName,
        category,
        fileName,
        (status) => {
          if (status === 'error') updateStepStatus('upload', 'error')
        },
        (status) => {
          if (status === 'error') updateStepStatus('upload', 'error')
        }
      )
      results.push(path)
    }
    return results
  }

  const uploadCoverImage = async (file: File): Promise<string> => {
    const { uploadArtitudeArtistImage } = await import('@/lib/r2/storage')
    const fileName = file.name.replace(/\.[^/.]+$/, '') || 'cover'
    return uploadArtitudeArtistImage(
      file,
      folderName,
      'cover',
      fileName,
      (status) => {
        if (status === 'error') updateStepStatus('upload', 'error')
      },
      (status) => {
        if (status === 'error') updateStepStatus('upload', 'error')
      }
    )
  }

  // Tous les champs validés par zod (formSchema) vivent dans l'onglet "Informations".
  // Si la validation échoue pendant que l'utilisateur est sur l'onglet "Photos",
  // on le ramène automatiquement sur l'onglet "Informations" pour voir les erreurs.
  const onInvalid = () => {
    if (activeTabId !== 'info') {
      setActiveTabId('info')
    }
  }

  const onSubmit = async (data: FormValues) => {
    setFormError(null)
    setIsSubmitting(true)
    setShowProgressModal(true)
    setProgressError(undefined)
    setProgressSteps([
      { id: 'validation', label: 'Validation des données', status: 'pending' },
      { id: 'upload', label: 'Conversion et upload des images', status: 'pending' },
      { id: 'update', label: 'Mise à jour de la fiche Artitude', status: 'pending' },
      { id: 'finalization', label: 'Finalisation', status: 'pending' },
    ])

    // Accumule tous les nouveaux chemins uploadés (durablement écrits sur R2) pour
    // pouvoir les nettoyer si une catégorie suivante ou la mise à jour DB échoue,
    // et éviter des fichiers orphelins sur R2.
    const uploadedPaths: string[] = []

    const cleanupUploadedFiles = async () => {
      if (uploadedPaths.length === 0) return
      const { deleteImageFromFirebase } = await import('@/lib/r2/storage')
      await Promise.all(uploadedPaths.map((path) => deleteImageFromFirebase(path).catch(() => false)))
    }

    try {
      updateStepStatus('validation', 'in-progress')
      updateStepStatus('validation', 'completed')

      updateStepStatus('upload', 'in-progress')

      let newCoverImage: string | null = null
      let newInteriorImages: string[] = []
      let newExteriorImages: string[] = []
      let newArtistImages: string[] = []
      let newOtherImages: string[] = []

      try {
        if (coverFile) {
          newCoverImage = await uploadCoverImage(coverFile)
          uploadedPaths.push(newCoverImage)
        }
        newInteriorImages = await uploadCategory(interiorFiles, 'interior')
        uploadedPaths.push(...newInteriorImages)
        newExteriorImages = await uploadCategory(exteriorFiles, 'exterior')
        uploadedPaths.push(...newExteriorImages)
        newArtistImages = await uploadCategory(artistFiles, 'artist')
        uploadedPaths.push(...newArtistImages)
        newOtherImages = await uploadCategory(otherFiles, 'others')
        uploadedPaths.push(...newOtherImages)
      } catch (uploadError: any) {
        updateStepStatus('upload', 'error')
        await cleanupUploadedFiles()
        const errorMessage = uploadError?.message || "Erreur lors de l'upload des images"
        setProgressError(errorMessage)
        setFormError(errorMessage)
        error(errorMessage)
        setIsSubmitting(false)
        return
      }

      updateStepStatus('upload', 'completed')

      updateStepStatus('update', 'in-progress')

      const openingHours: OpeningHoursPeriod[] = DAYS.filter((d) => hours[d.key].enabled).map(
        (d) => ({
          day: d.key,
          openTime: hours[d.key].openTime,
          closeTime: hours[d.key].closeTime,
        })
      )

      const result = await updateArtitudeArtistAction(artitudeArtist.id, {
        addressLine1: data.addressLine1,
        addressLine2: data.addressLine2 || null,
        postalCode: data.postalCode,
        city: data.city,
        countryCode: data.countryCode || null,
        latitude: data.latitude ? Number(data.latitude) : null,
        longitude: data.longitude ? Number(data.longitude) : null,
        phoneNumber: data.phoneNumber || null,
        websiteUrl: data.websiteUrl || null,
        googleBusinessProfileUrl: data.googleBusinessProfileUrl,
        openingHours: openingHours.length > 0 ? openingHours : null,
        coverImage: newCoverImage ?? existingCoverImage,
        interiorImages: [...existingInteriorImages, ...newInteriorImages],
        exteriorImages: [...existingExteriorImages, ...newExteriorImages],
        artistImages: [...existingArtistImages, ...newArtistImages],
        otherImages: [...existingOtherImages, ...newOtherImages],
      })

      if (result.success) {
        updateStepStatus('update', 'completed')
        updateStepStatus('finalization', 'in-progress')
        await new Promise((resolve) => setTimeout(resolve, 500))
        updateStepStatus('finalization', 'completed')

        success('Fiche Artitude mise à jour avec succès')

        setTimeout(() => {
          setShowProgressModal(false)
          router.push('/landing/indexArtitude')
          router.refresh()
        }, 1000)
      } else {
        updateStepStatus('update', 'error')
        await cleanupUploadedFiles()
        setProgressError(result.message || 'Une erreur est survenue')
        error(result.message || 'Une erreur est survenue')
        setIsSubmitting(false)
      }
    } catch (err: any) {
      console.error('Erreur lors de la mise à jour de la fiche Artitude:', err)
      const errorMessage =
        err?.message || 'Une erreur est survenue lors de la mise à jour de la fiche Artitude'
      updateStepStatus('update', 'error')
      await cleanupUploadedFiles().catch(() => undefined)
      setProgressError(errorMessage)
      error(errorMessage)
      setFormError('Une erreur est survenue')
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    router.push('/landing/indexArtitude')
  }

  const infoTabContent = (
    <>
      <div className="form-section">
        <h2 className="section-title">Adresse</h2>
        <div className="form-group">
          <label htmlFor="addressLine1" className="form-label">
            Adresse (numéro et rue)
          </label>
          <input
            id="addressLine1"
            type="text"
            {...register('addressLine1')}
            className={`form-input ${errors.addressLine1 ? 'input-error' : ''}`}
            placeholder="12 rue des Artistes"
          />
          {errors.addressLine1 && (
            <p className="form-error">{errors.addressLine1.message}</p>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="addressLine2" className="form-label">
            Complément d'adresse (optionnel)
          </label>
          <input
            id="addressLine2"
            type="text"
            {...register('addressLine2')}
            className="form-input"
            placeholder="Bâtiment, étage..."
          />
        </div>
        <div className="d-flex gap-md">
          <div className="form-group" style={{ flex: 1 }}>
            <label htmlFor="postalCode" className="form-label">
              Code postal
            </label>
            <input
              id="postalCode"
              type="text"
              {...register('postalCode')}
              className={`form-input ${errors.postalCode ? 'input-error' : ''}`}
              placeholder="75001"
            />
            {errors.postalCode && (
              <p className="form-error">{errors.postalCode.message}</p>
            )}
          </div>
          <div className="form-group" style={{ flex: 2 }}>
            <label htmlFor="city" className="form-label">
              Ville
            </label>
            <input
              id="city"
              type="text"
              {...register('city')}
              className={`form-input ${errors.city ? 'input-error' : ''}`}
              placeholder="Paris"
            />
            {errors.city && <p className="form-error">{errors.city.message}</p>}
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="countryCode" className="form-label">
            Pays
          </label>
          <select id="countryCode" {...register('countryCode')} className="form-select">
            <option value="">-- Sélectionner un pays --</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="d-flex gap-md align-items-start">
          <div className="form-group" style={{ flex: 1 }}>
            <label htmlFor="latitude" className="form-label">
              Latitude
              {geocodingStatus === 'loading' && (
                <span className="text-muted"> (calcul en cours...)</span>
              )}
            </label>
            <input
              id="latitude"
              type="text"
              {...register('latitude')}
              readOnly={geocodingStatus !== 'not-found'}
              className={`form-input ${errors.latitude ? 'input-error' : ''}`}
              style={geocodingStatus !== 'not-found' ? { backgroundColor: '#f9f9f9' } : undefined}
              placeholder="48.856614"
            />
            {errors.latitude && <p className="form-error">{errors.latitude.message}</p>}
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label htmlFor="longitude" className="form-label">
              Longitude
              {geocodingStatus === 'loading' && (
                <span className="text-muted"> (calcul en cours...)</span>
              )}
            </label>
            <input
              id="longitude"
              type="text"
              {...register('longitude')}
              readOnly={geocodingStatus !== 'not-found'}
              className={`form-input ${errors.longitude ? 'input-error' : ''}`}
              style={geocodingStatus !== 'not-found' ? { backgroundColor: '#f9f9f9' } : undefined}
              placeholder="2.352222"
            />
            {errors.longitude && <p className="form-error">{errors.longitude.message}</p>}
          </div>
        </div>
        {geocodingStatus === 'not-found' && (
          <p className="text-muted" style={{ fontSize: '0.875rem' }}>
            Impossible de localiser automatiquement cette adresse. Vous pouvez saisir la latitude et la longitude manuellement.
          </p>
        )}
      </div>

      <div className="form-section mt-lg">
        <h2 className="section-title">Contact</h2>
        <div className="form-group">
          <label htmlFor="phoneNumber" className="form-label">
            Téléphone (optionnel)
          </label>
          <input
            id="phoneNumber"
            type="text"
            {...register('phoneNumber')}
            className={`form-input ${errors.phoneNumber ? 'input-error' : ''}`}
            placeholder="+33 1 23 45 67 89"
          />
          {errors.phoneNumber && (
            <p className="form-error">{errors.phoneNumber.message}</p>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="websiteUrl" className="form-label">
            Site web
          </label>
          <input
            id="websiteUrl"
            type="text"
            {...register('websiteUrl')}
            className={`form-input ${errors.websiteUrl ? 'input-error' : ''}`}
            placeholder="https://site-artiste.com"
          />
          {errors.websiteUrl && (
            <p className="form-error">{errors.websiteUrl.message}</p>
          )}
        </div>
        <div className="form-group">
          <label htmlFor="googleBusinessProfileUrl" className="form-label">
            Lien de la fiche établissement Google
          </label>
          <input
            id="googleBusinessProfileUrl"
            type="text"
            {...register('googleBusinessProfileUrl')}
            className={`form-input ${errors.googleBusinessProfileUrl ? 'input-error' : ''}`}
            placeholder="https://www.google.com/maps/place/..."
          />
          {errors.googleBusinessProfileUrl && (
            <p className="form-error">{errors.googleBusinessProfileUrl.message}</p>
          )}
        </div>
      </div>

      <div className="form-section mt-lg">
        <h2 className="section-title">Horaires d'ouverture</h2>
        <div className="d-flex flex-column gap-sm">
          {DAYS.map((day) => (
            <div key={day.key} className="d-flex align-items-center gap-md">
              <label className="d-flex align-items-center gap-sm" style={{ width: '120px' }}>
                <input
                  type="checkbox"
                  checked={hours[day.key].enabled}
                  onChange={() => toggleDay(day.key)}
                />
                {day.label}
              </label>
              <input
                type="time"
                value={hours[day.key].openTime}
                disabled={!hours[day.key].enabled}
                onChange={(e) => updateDayTime(day.key, 'openTime', e.target.value)}
                className="form-input"
                style={{ width: '130px' }}
              />
              <span>-</span>
              <input
                type="time"
                value={hours[day.key].closeTime}
                disabled={!hours[day.key].enabled}
                onChange={(e) => updateDayTime(day.key, 'closeTime', e.target.value)}
                className="form-input"
                style={{ width: '130px' }}
              />
            </div>
          ))}
        </div>
      </div>
    </>
  )

  const photosTabContent = (
    <div className="form-section">
      <p className="section-subtitle">
        Les images seront converties en WebP et stockées dans /ARTITUDE/{folderName}/
      </p>
      <div className="d-flex flex-column gap-lg mt-md">
        <OptionalImageUpload
          onFileSelect={setCoverFile}
          previewUrl={existingCoverImage}
          onDelete={() => setExistingCoverImage(null)}
          allowDelete
          label="Photo de couverture"
          description="Photo principale affichée en tête de la fiche établissement"
        />
        <ArtitudeMultiImageUpload
          label="Photos intérieures"
          description="Photos de l'intérieur de l'établissement"
          files={interiorFiles}
          onFilesChange={setInteriorFiles}
          existingImages={existingInteriorImages}
          onExistingImageRemove={(path) =>
            setExistingInteriorImages((prev) => prev.filter((p) => p !== path))
          }
        />
        <ArtitudeMultiImageUpload
          label="Photos extérieures"
          description="Photos de l'extérieur de l'établissement"
          files={exteriorFiles}
          onFilesChange={setExteriorFiles}
          existingImages={existingExteriorImages}
          onExistingImageRemove={(path) =>
            setExistingExteriorImages((prev) => prev.filter((p) => p !== path))
          }
        />
        <ArtitudeMultiImageUpload
          label="Photos de l'artiste"
          description="Photos de l'artiste"
          files={artistFiles}
          onFilesChange={setArtistFiles}
          existingImages={existingArtistImages}
          onExistingImageRemove={(path) =>
            setExistingArtistImages((prev) => prev.filter((p) => p !== path))
          }
        />
        <ArtitudeMultiImageUpload
          label="Autres photos"
          description="Photos diverses"
          files={otherFiles}
          onFilesChange={setOtherFiles}
          existingImages={existingOtherImages}
          onExistingImageRemove={(path) =>
            setExistingOtherImages((prev) => prev.filter((p) => p !== path))
          }
        />
      </div>
    </div>
  )

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">
            Modifier la fiche Artitude — {getArtistFullName(artitudeArtist.artist)}
          </h1>
        </div>
        <p className="page-subtitle">Modifiez les informations de la fiche établissement Artitude</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="form-container">
        <div className="form-card">
          <div className="card-content">
            {formError && (
              <div className="alert alert-danger mb-4">
                <p>{formError}</p>
              </div>
            )}

            <Tabs
              tabs={[
                { id: 'info', label: 'Informations', content: infoTabContent },
                { id: 'photos', label: 'Photos', content: photosTabContent },
              ]}
              activeTabId={activeTabId}
              onTabChange={setActiveTabId}
            />
          </div>

          <div className="card-footer">
            <div className="d-flex justify-content-between">
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
                {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      </form>

      <ProgressModal
        isOpen={showProgressModal}
        steps={progressSteps}
        currentError={progressError}
        onClose={
          progressError
            ? () => {
                setShowProgressModal(false)
                setProgressError(undefined)
              }
            : undefined
        }
      />
    </div>
  )
}
