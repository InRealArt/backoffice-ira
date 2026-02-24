'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useDropzone } from 'react-dropzone'
import { X, Upload, Film, ImageIcon } from 'lucide-react'
import { useToast } from '@/app/components/Toast/ToastContext'
import ArtistImageUpload from '@/app/components/art/ArtistImageUpload'
import ProgressModal from '@/app/components/art/ProgressModal'
import {
    createUgcArtistProfile,
    updateUgcArtistProfile,
    fetchImageForUgcUpload,
} from '@/lib/actions/ugc-artist-profile-actions'
import type { UgcArtistProfileWithRelations } from '@/lib/actions/ugc-artist-profile-actions'

const formSchema = z
    .object({
        name: z.string().optional().nullable(),
        surname: z.string().optional().nullable(),
        pseudo: z.string().optional().nullable(),
        profileImageUrl: z.string().optional(),
        title: z.string().optional().nullable(),
        description: z.string().optional().nullable(),
        mediaUrls: z.array(z.string()).default([]),
        landingArtistId: z.number().optional().nullable(),
        creationMode: z.enum(['from_artist', 'from_scratch']).default('from_scratch'),
    })
    .superRefine((data, ctx) => {
        const hasName = data.name && data.name.trim() !== ''
        const hasSurname = data.surname && data.surname.trim() !== ''
        const hasPseudo = data.pseudo && data.pseudo.trim() !== ''
        const hasBothNames = hasName && hasSurname

        if (!hasBothNames && !hasPseudo) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: 'Vous devez renseigner soit le nom ET le prénom, soit le pseudo',
                path: ['pseudo'],
            })
        }
    })

type FormValues = z.infer<typeof formSchema>

type LandingArtistOption = {
    id: number
    imageUrl: string
    artist: { name: string | null; surname: string | null; pseudo: string | null }
    ugcArtistProfile: { id: number } | null
}

interface UgcArtistProfileFormProps {
    profile?: UgcArtistProfileWithRelations
    landingArtists: LandingArtistOption[]
}

const VIDEO_MAX_SIZE_MB = 25
const VIDEO_MAX_DURATION_S = 60
const VIDEO_MIN_DURATION_S = 3

function formatDuration (seconds: number): string {
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
}

function validateVideoFile (file: File): Promise<{ valid: boolean; reason?: string; duration?: number }> {
    return new Promise((resolve) => {
        if (file.size > VIDEO_MAX_SIZE_MB * 1024 * 1024) {
            resolve({
                valid: false,
                reason: `Taille max ${VIDEO_MAX_SIZE_MB} Mo (fichier : ${(file.size / 1024 / 1024).toFixed(1)} Mo)`,
            })
            return
        }
        const url = URL.createObjectURL(file)
        const video = document.createElement('video')
        video.preload = 'metadata'
        video.onloadedmetadata = () => {
            URL.revokeObjectURL(url)
            const duration = video.duration
            if (duration < VIDEO_MIN_DURATION_S) {
                resolve({ valid: false, reason: `Durée min : ${VIDEO_MIN_DURATION_S}s (fichier : ${duration.toFixed(1)}s)` })
            } else if (duration > VIDEO_MAX_DURATION_S) {
                const max = formatDuration(VIDEO_MAX_DURATION_S)
                const got = formatDuration(duration)
                resolve({ valid: false, reason: `Durée max : ${max} (fichier : ${got})` })
            } else {
                resolve({ valid: true, duration })
            }
        }
        video.onerror = () => {
            URL.revokeObjectURL(url)
            resolve({ valid: false, reason: 'Impossible de lire la vidéo' })
        }
        video.src = url
    })
}

function computeFolderName(name?: string | null, surname?: string | null, pseudo?: string | null): string {
    if (name && name.trim() && surname && surname.trim()) {
        return `${name.trim()} ${surname.trim()}`
    }
    return pseudo?.trim() || 'unknown'
}

function getArtistOptionLabel(artist: LandingArtistOption['artist']): string {
    if (artist.name && artist.surname) return `${artist.name} ${artist.surname}`
    if (artist.pseudo) return artist.pseudo
    if (artist.name) return artist.name
    if (artist.surname) return artist.surname
    return '(Sans nom)'
}

export default function UgcArtistProfileForm({ profile, landingArtists }: UgcArtistProfileFormProps) {
    const router = useRouter()
    const { success, error } = useToast()
    const isEditMode = !!profile

    const [profileImageFile, setProfileImageFile] = useState<File | null>(null)
    const [deletedProfileImage, setDeletedProfileImage] = useState(false)

    type NewMediaItem = { file: File; preview: string; isVideo: boolean; duration?: number }
    const [newMediaItems, setNewMediaItems] = useState<NewMediaItem[]>([])
    const [mediaErrors, setMediaErrors] = useState<string[]>([])
    const [existingMediaUrls, setExistingMediaUrls] = useState<string[]>(
        profile?.mediaUrls ?? []
    )

    const [isSubmitting, setIsSubmitting] = useState(false)
    const [formError, setFormError] = useState<string | null>(null)
    const [showProgressModal, setShowProgressModal] = useState(false)
    const [progressSteps, setProgressSteps] = useState<
        Array<{ id: string; label: string; status: 'pending' | 'in-progress' | 'completed' | 'error' }>
    >([
        { id: 'validation', label: 'Validation des données', status: 'pending' },
        { id: 'upload-profile', label: "Upload de l'image de profil", status: 'pending' },
        { id: 'upload-media', label: 'Upload des médias', status: 'pending' },
        { id: 'save', label: 'Enregistrement', status: 'pending' },
        { id: 'finalization', label: 'Finalisation', status: 'pending' },
    ])
    const [progressError, setProgressError] = useState<string | undefined>(undefined)

    const updateStepStatus = useCallback(
        (stepId: string, status: 'pending' | 'in-progress' | 'completed' | 'error') => {
            setProgressSteps((prev) =>
                prev.map((step) => (step.id === stepId ? { ...step, status } : step))
            )
        },
        []
    )

    const resetSteps = () => {
        setProgressSteps([
            { id: 'validation', label: 'Validation des données', status: 'pending' },
            { id: 'upload-profile', label: "Upload de l'image de profil", status: 'pending' },
            { id: 'upload-media', label: 'Upload des médias', status: 'pending' },
            { id: 'save', label: 'Enregistrement', status: 'pending' },
            { id: 'finalization', label: 'Finalisation', status: 'pending' },
        ])
    }

    const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: profile?.name ?? '',
            surname: profile?.surname ?? '',
            pseudo: profile?.pseudo ?? '',
            profileImageUrl: profile?.profileImageUrl ?? '',
            title: profile?.title ?? '',
            description: profile?.description ?? '',
            mediaUrls: profile?.mediaUrls ?? [],
            landingArtistId: profile?.landingArtistId ?? null,
            creationMode: 'from_scratch',
        },
    })

    const creationMode = watch('creationMode')

    // When user selects a landing artist from dropdown
    const handleLandingArtistSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value ? parseInt(e.target.value, 10) : null
        setValue('landingArtistId', id)
        if (id) {
            const selected = landingArtists.find((a) => a.id === id)
            if (selected) {
                setValue('name', selected.artist.name ?? '')
                setValue('surname', selected.artist.surname ?? '')
                setValue('pseudo', selected.artist.pseudo ?? '')
                // Pre-fill profile image from LandingArtist
                setValue('profileImageUrl', selected.imageUrl)
                setDeletedProfileImage(false)
                setProfileImageFile(null)
            }
        }
    }

    const handleDeleteProfileImage = useCallback(async () => {
        if (profile?.profileImageUrl) {
            try {
                const { deleteImageFromFirebase } = await import('@/lib/firebase/storage')
                await deleteImageFromFirebase(profile.profileImageUrl)
                success('Image de profil supprimée')
            } catch {
                // Non-blocking
            }
        }
        setDeletedProfileImage(true)
        setProfileImageFile(null)
        setValue('profileImageUrl', '')
    }, [profile?.profileImageUrl, success, setValue])

    const onDropMedia = useCallback(async (acceptedFiles: File[]) => {
        setMediaErrors([])
        const errors: string[] = []
        const valid: NewMediaItem[] = []

        for (const file of acceptedFiles) {
            if (file.type.startsWith('video/')) {
                const result = await validateVideoFile(file)
                if (!result.valid) {
                    errors.push(`${file.name} — ${result.reason}`)
                    continue
                }
                const previewUrl = URL.createObjectURL(file)
                valid.push({ file, preview: previewUrl, isVideo: true, duration: result.duration })
            } else {
                await new Promise<void>((resolve) => {
                    const reader = new FileReader()
                    reader.onloadend = () => {
                        valid.push({ file, preview: reader.result as string, isVideo: false })
                        resolve()
                    }
                    reader.readAsDataURL(file)
                })
            }
        }

        if (errors.length > 0) setMediaErrors(errors)
        if (valid.length > 0) setNewMediaItems((prev) => [...prev, ...valid])
    }, [])

    const { getRootProps: getMediaRootProps, getInputProps: getMediaInputProps, isDragActive: isMediaDragActive } = useDropzone({
        onDrop: onDropMedia,
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
            'video/*': ['.mp4', '.webm', '.mov', '.avi'],
        },
        multiple: true,
    })

    const handleRemoveNewMedia = (index: number) => {
        setNewMediaItems((prev) => prev.filter((_, i) => i !== index))
    }

    const handleRemoveExistingMedia = async (url: string) => {
        try {
            const { deleteImageFromFirebase } = await import('@/lib/firebase/storage')
            await deleteImageFromFirebase(url)
        } catch {
            // Non-blocking
        }
        setExistingMediaUrls((prev) => prev.filter((u) => u !== url))
    }

    const onSubmit = async (data: FormValues) => {
        setFormError(null)
        setIsSubmitting(true)
        setShowProgressModal(true)
        setProgressError(undefined)
        resetSteps()

        try {
            // Step 1: Validation
            updateStepStatus('validation', 'in-progress')

            const hasProfileImage = profileImageFile || (profile?.profileImageUrl && !deletedProfileImage) || (data.profileImageUrl && data.profileImageUrl.trim() !== '' && !deletedProfileImage)
            if (!hasProfileImage) {
                updateStepStatus('validation', 'error')
                const msg = "Veuillez sélectionner une image de profil"
                setProgressError(msg)
                setFormError(msg)
                error(msg)
                setIsSubmitting(false)
                return
            }
            updateStepStatus('validation', 'completed')

            const folderName = computeFolderName(data.name, data.surname, data.pseudo)

            // Step 2: Upload profile image — toujours dans artistsUGC/<Prénom Nom>
            updateStepStatus('upload-profile', 'in-progress')
            let finalProfileUrl = deletedProfileImage ? '' : (profile?.profileImageUrl ?? data.profileImageUrl ?? '')

            if (profileImageFile) {
                try {
                    const { uploadImageToUgcFolder } = await import('@/lib/firebase/storage')
                    finalProfileUrl = await uploadImageToUgcFolder(
                        profileImageFile,
                        folderName,
                        'profile',
                        (status) => {
                            if (status === 'error') updateStepStatus('upload-profile', 'error')
                        },
                        (status) => {
                            if (status === 'error') updateStepStatus('upload-profile', 'error')
                        }
                    )
                } catch (uploadError: unknown) {
                    updateStepStatus('upload-profile', 'error')
                    const msg = uploadError instanceof Error ? uploadError.message : "Erreur lors de l'upload de l'image de profil"
                    setProgressError(msg)
                    setFormError(msg)
                    error(msg)
                    setIsSubmitting(false)
                    return
                }
            } else if (finalProfileUrl && !finalProfileUrl.includes('artistsUGC/')) {
                // Image pré-remplie (ex. depuis artiste IRA) : récupération serveur (pas de CORS) puis upload vers artistsUGC
                try {
                    const result = await fetchImageForUgcUpload(finalProfileUrl)
                    if (!result.success) throw new Error(result.message)
                    const binary = atob(result.base64)
                    const bytes = new Uint8Array(binary.length)
                    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
                    const file = new File([bytes], 'profile', { type: result.mimeType })
                    const { uploadImageToUgcFolder } = await import('@/lib/firebase/storage')
                    finalProfileUrl = await uploadImageToUgcFolder(
                        file,
                        folderName,
                        'profile',
                        (status) => { if (status === 'error') updateStepStatus('upload-profile', 'error') },
                        (status) => { if (status === 'error') updateStepStatus('upload-profile', 'error') }
                    )
                } catch (uploadError: unknown) {
                    updateStepStatus('upload-profile', 'error')
                    const msg = uploadError instanceof Error ? uploadError.message : "Erreur lors de l'upload de l'image de profil vers artistsUGC"
                    setProgressError(msg)
                    setFormError(msg)
                    error(msg)
                    setIsSubmitting(false)
                    return
                }
            }
            updateStepStatus('upload-profile', 'completed')

            // Step 3: Upload new media files (images + videos)
            updateStepStatus('upload-media', 'in-progress')
            const uploadedMediaUrls: string[] = [...existingMediaUrls]

            for (let i = 0; i < newMediaItems.length; i++) {
                try {
                    const { uploadMediaToUgcFolder } = await import('@/lib/firebase/storage')
                    const mediaUrl = await uploadMediaToUgcFolder(
                        newMediaItems[i].file,
                        folderName,
                        `media-${Date.now()}-${i}`
                    )
                    uploadedMediaUrls.push(mediaUrl)
                } catch (uploadError: unknown) {
                    console.error(`Erreur upload media ${i}:`, uploadError)
                    // Non-blocking: continue with other media
                }
            }
            updateStepStatus('upload-media', 'completed')

            // Step 4: Save
            updateStepStatus('save', 'in-progress')

            const saveData = {
                name: data.name?.trim() || null,
                surname: data.surname?.trim() || null,
                pseudo: data.pseudo?.trim() || null,
                profileImageUrl: finalProfileUrl,
                title: data.title?.trim() || null,
                description: data.description?.trim() || null,
                mediaUrls: uploadedMediaUrls,
                ...(isEditMode ? {} : { landingArtistId: data.landingArtistId ?? null }),
            }

            let result: { success: boolean; message?: string }
            if (isEditMode && profile) {
                result = await updateUgcArtistProfile(profile.id, saveData)
            } else {
                result = await createUgcArtistProfile(saveData as Parameters<typeof createUgcArtistProfile>[0])
            }

            if (!result.success) {
                updateStepStatus('save', 'error')
                const msg = result.message || 'Une erreur est survenue'
                setProgressError(msg)
                error(msg)
                setIsSubmitting(false)
                return
            }
            updateStepStatus('save', 'completed')

            // Step 5: Finalization
            updateStepStatus('finalization', 'in-progress')
            await new Promise((resolve) => setTimeout(resolve, 500))
            updateStepStatus('finalization', 'completed')

            success(isEditMode ? 'Profil mis à jour avec succès' : 'Profil créé avec succès')

            setTimeout(() => {
                setShowProgressModal(false)
                router.push('/landing/ugc/artist-profiles')
                router.refresh()
            }, 1000)
        } catch (err: unknown) {
            console.error('Erreur lors de la sauvegarde du profil UGC:', err)
            const msg = err instanceof Error ? err.message : 'Une erreur est survenue'
            setProgressError(msg)
            setFormError(msg)
            error(msg)
            setIsSubmitting(false)
        }
    }

    const handleCancel = () => {
        router.push('/landing/ugc/artist-profiles')
    }

    const previewProfileUrl = deletedProfileImage
        ? null
        : profileImageFile
            ? null
            : (watch('profileImageUrl') || profile?.profileImageUrl || null)

    // Available landing artists: those without a UGC profile (or the currently linked one in edit mode)
    const availableLandingArtists = landingArtists.filter(
        (a) => !a.ugcArtistProfile || a.ugcArtistProfile.id === profile?.id
    )

    return (
        <div className="page-container">
            <div className="page-header">
                <div className="header-top-section">
                    <h1 className="page-title">
                        {isEditMode ? 'Modifier le profil artiste UGC' : 'Créer un profil artiste UGC'}
                    </h1>
                </div>
                <p className="page-subtitle">
                    {isEditMode
                        ? 'Modifier les informations du profil artiste UGC'
                        : 'Créer un nouveau profil artiste pour la section UGC de la landing'}
                </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="form-container">
                <div className="form-card">
                    <div className="card-content">
                        {formError && (
                            <div className="alert alert-danger mb-4">
                                <p>{formError}</p>
                            </div>
                        )}

                        {/* Creation mode selector - only in create mode */}
                        {!isEditMode && (
                            <div className="form-section">
                                <h2 className="section-title">Mode de création</h2>
                                <div className="d-flex gap-md">
                                    <label className="d-flex align-items-center gap-sm" style={{ cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            {...register('creationMode')}
                                            value="from_scratch"
                                        />
                                        <span>From scratch (saisie manuelle)</span>
                                    </label>
                                    <label className="d-flex align-items-center gap-sm" style={{ cursor: 'pointer' }}>
                                        <input
                                            type="radio"
                                            {...register('creationMode')}
                                            value="from_artist"
                                        />
                                        <span>Depuis un artiste IRA existant</span>
                                    </label>
                                </div>

                                {creationMode === 'from_artist' && (
                                    <div className="form-group mt-md">
                                        <label className="form-label">Sélectionner un artiste IRA</label>
                                        <select
                                            className="form-input"
                                            onChange={handleLandingArtistSelect}
                                            defaultValue=""
                                        >
                                            <option value="">-- Choisir un artiste --</option>
                                            {availableLandingArtists.map((a) => (
                                                <option key={a.id} value={a.id}>
                                                    {getArtistOptionLabel(a.artist)}
                                                </option>
                                            ))}
                                        </select>
                                        {availableLandingArtists.length === 0 && (
                                            <p className="text-muted mt-sm">
                                                Tous les artistes IRA ont déjà un profil UGC.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Identity section */}
                        <div className="form-section mt-lg">
                            <h2 className="section-title">Identité de l&apos;artiste</h2>

                            {isEditMode && profile?.landingArtistId && (
                                <div className="alert alert-info mb-md">
                                    <p>Ce profil est lié à un artiste IRA. Les champs nom/prénom peuvent être modifiés indépendamment.</p>
                                </div>
                            )}

                            <div className="d-flex gap-md">
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label htmlFor="name" className="form-label">Prénom</label>
                                    <input
                                        id="name"
                                        type="text"
                                        {...register('name')}
                                        className={`form-input ${errors.name ? 'input-error' : ''}`}
                                        placeholder="Prénom de l'artiste"
                                    />
                                    {errors.name && <p className="form-error">{errors.name.message}</p>}
                                </div>
                                <div className="form-group" style={{ flex: 1 }}>
                                    <label htmlFor="surname" className="form-label">Nom</label>
                                    <input
                                        id="surname"
                                        type="text"
                                        {...register('surname')}
                                        className={`form-input ${errors.surname ? 'input-error' : ''}`}
                                        placeholder="Nom de l'artiste"
                                    />
                                    {errors.surname && <p className="form-error">{errors.surname.message}</p>}
                                </div>
                            </div>

                            <div className="form-group mt-md">
                                <label htmlFor="pseudo" className="form-label">Pseudo</label>
                                <input
                                    id="pseudo"
                                    type="text"
                                    {...register('pseudo')}
                                    className={`form-input ${errors.pseudo ? 'input-error' : ''}`}
                                    placeholder="Pseudo ou nom d'artiste"
                                />
                                {errors.pseudo && <p className="form-error">{errors.pseudo.message}</p>}
                                <p className="text-muted" style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                                    Requis si le nom ET le prénom ne sont pas renseignés.
                                </p>
                            </div>
                        </div>

                        {/* Profile image section */}
                        <div className="form-section mt-lg">
                            <h2 className="section-title">Image de profil <span style={{ color: 'red' }}>*</span></h2>
                            <ArtistImageUpload
                                onFileSelect={(file) => {
                                    setProfileImageFile(file)
                                    setDeletedProfileImage(false)
                                }}
                                previewUrl={previewProfileUrl}
                                allowDelete={!!profile?.profileImageUrl && !deletedProfileImage}
                                onDelete={handleDeleteProfileImage}
                                error={
                                    formError && !profileImageFile && !profile?.profileImageUrl && !deletedProfileImage
                                        ? 'Une image de profil est requise'
                                        : undefined
                                }
                            />
                        </div>

                        {/* Info section */}
                        <div className="form-section mt-lg">
                            <h2 className="section-title">Informations</h2>

                            <div className="form-group">
                                <label htmlFor="title" className="form-label">Titre / Accroche</label>
                                <input
                                    id="title"
                                    type="text"
                                    {...register('title')}
                                    className="form-input"
                                    placeholder="Ex: Peintre contemporain"
                                />
                            </div>

                            <div className="form-group mt-md">
                                <label htmlFor="description" className="form-label">Description</label>
                                <textarea
                                    id="description"
                                    {...register('description')}
                                    className="form-textarea"
                                    rows={5}
                                    placeholder="Description de l'artiste"
                                />
                            </div>
                        </div>

                        {/* Media section */}
                        <div className="form-section mt-lg">
                            <h2 className="section-title">Médias (galerie)</h2>
                            <p className="section-subtitle">
                                Ajoutez plusieurs images ou vidéos pour la galerie de l&apos;artiste
                            </p>

                            {/* Existing media URLs */}
                            {existingMediaUrls.length > 0 && (
                                <div className="mb-md">
                                    <p className="form-label mb-sm">Médias existants</p>
                                    <div className="d-flex gap-md" style={{ flexWrap: 'wrap' }}>
                                        {existingMediaUrls.map((url, index) => {
                                            const isVideo = url.includes('.mp4') || url.includes('.webm') || url.includes('.mov') || url.includes('.avi')
                                            return (
                                                <div
                                                    key={url}
                                                    style={{ position: 'relative', width: '150px', flexShrink: 0 }}
                                                >
                                                    <div
                                                        style={{
                                                            position: 'relative',
                                                            width: '150px',
                                                            height: '150px',
                                                            borderRadius: '8px',
                                                            overflow: 'hidden',
                                                            background: '#111',
                                                        }}
                                                    >
                                                        {isVideo ? (
                                                            <video
                                                                src={url}
                                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                                muted
                                                                playsInline
                                                            />
                                                        ) : (
                                                            <Image
                                                                src={url}
                                                                alt={`Média ${index + 1}`}
                                                                fill
                                                                sizes="150px"
                                                                style={{ objectFit: 'cover' }}
                                                            />
                                                        )}
                                                        {isVideo && (
                                                            <div style={{ position: 'absolute', bottom: '4px', left: '4px' }}>
                                                                <Film size={14} color="white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveExistingMedia(url)}
                                                        className="btn btn-danger btn-small"
                                                        style={{
                                                            position: 'absolute',
                                                            top: '5px',
                                                            right: '5px',
                                                            padding: '4px',
                                                            borderRadius: '50%',
                                                        }}
                                                        aria-label="Supprimer le média"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* New media preview */}
                            {newMediaItems.length > 0 && (
                                <div className="mb-md">
                                    <p className="form-label mb-sm">Nouveaux médias à uploader ({newMediaItems.length})</p>
                                    <div className="d-flex gap-md" style={{ flexWrap: 'wrap' }}>
                                        {newMediaItems.map((item, index) => (
                                            <div
                                                key={index}
                                                style={{ position: 'relative', width: '150px', flexShrink: 0 }}
                                            >
                                                <div
                                                    style={{
                                                        position: 'relative',
                                                        width: '150px',
                                                        height: '150px',
                                                        borderRadius: '8px',
                                                        overflow: 'hidden',
                                                        border: '2px dashed #6366f1',
                                                        background: '#111',
                                                    }}
                                                >
                                                    {item.isVideo ? (
                                                        <video
                                                            src={item.preview}
                                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                            muted
                                                            playsInline
                                                        />
                                                    ) : (
                                                        <Image
                                                            src={item.preview}
                                                            alt={`Nouveau média ${index + 1}`}
                                                            fill
                                                            sizes="150px"
                                                            style={{ objectFit: 'cover' }}
                                                        />
                                                    )}
                                                    {item.isVideo && (
                                                        <div style={{
                                                            position: 'absolute',
                                                            bottom: '4px',
                                                            left: '4px',
                                                            right: '4px',
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'space-between',
                                                        }}>
                                                            <Film size={12} color="white" />
                                                            {item.duration !== undefined && (
                                                                <span style={{
                                                                    fontSize: '0.65rem',
                                                                    fontWeight: 600,
                                                                    color: 'white',
                                                                    background: 'rgba(0,0,0,0.55)',
                                                                    borderRadius: '4px',
                                                                    padding: '1px 4px',
                                                                    letterSpacing: '0.02em',
                                                                }}>
                                                                    {formatDuration(item.duration)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveNewMedia(index)}
                                                    className="btn btn-danger btn-small"
                                                    style={{
                                                        position: 'absolute',
                                                        top: '5px',
                                                        right: '5px',
                                                        padding: '4px',
                                                        borderRadius: '50%',
                                                    }}
                                                    aria-label="Retirer le média"
                                                >
                                                    <X size={16} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Erreurs de validation vidéo */}
                            {mediaErrors.length > 0 && (
                                <div style={{
                                    background: '#fff1f0',
                                    border: '1px solid #ffccc7',
                                    borderRadius: '8px',
                                    padding: '0.75rem 1rem',
                                    marginBottom: '0.75rem',
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                        <div>
                                            <p style={{ margin: '0 0 0.25rem', fontSize: '0.8rem', fontWeight: 600, color: '#cf1322' }}>
                                                {mediaErrors.length} fichier{mediaErrors.length > 1 ? 's' : ''} rejeté{mediaErrors.length > 1 ? 's' : ''}
                                            </p>
                                            {mediaErrors.map((msg, i) => (
                                                <p key={i} style={{ margin: 0, fontSize: '0.75rem', color: '#a8071a' }}>• {msg}</p>
                                            ))}
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => setMediaErrors([])}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0 0 0 0.5rem', color: '#cf1322', flexShrink: 0 }}
                                            aria-label="Fermer"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Multi-file dropzone */}
                            <div
                                {...getMediaRootProps()}
                                style={{
                                    border: `2px dashed ${isMediaDragActive ? '#4dabf7' : '#ccc'}`,
                                    borderRadius: '8px',
                                    padding: '2rem',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    backgroundColor: isMediaDragActive ? '#f0f8ff' : '#fafafa',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                <input {...getMediaInputProps()} />
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                                        <ImageIcon size={24} color="#666" />
                                        <Film size={24} color="#666" />
                                        <Upload size={24} color="#666" />
                                    </div>
                                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 500 }}>
                                        {isMediaDragActive
                                            ? 'Déposez vos fichiers ici...'
                                            : 'Cliquez ou glissez-déposez des images et vidéos'}
                                    </p>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#666' }}>
                                        Images : JPEG, PNG, GIF, WebP — Vidéos : MP4, WebM, MOV, AVI
                                    </p>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#888' }}>
                                        Vidéos : {VIDEO_MIN_DURATION_S}s – {formatDuration(VIDEO_MAX_DURATION_S)} · max {VIDEO_MAX_SIZE_MB} Mo
                                    </p>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: '#aaa' }}>
                                        Sélection multiple supportée
                                    </p>
                                </div>
                            </div>
                        </div>
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
                                {isSubmitting ? 'Enregistrement...' : isEditMode ? 'Mettre à jour' : 'Créer'}
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
