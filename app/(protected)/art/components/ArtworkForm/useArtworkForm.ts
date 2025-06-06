'use client'

import { useState, useRef, useEffect, useCallback, RefObject } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { artworkSchema, artworkEditSchema, ArtworkFormData } from '../../createArtwork/schema'
import { useToast } from '@/app/components/Toast/ToastContext'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { getBackofficeUserByEmail, createItemRecord, updateItemRecord, savePhysicalCertificate, saveNftCertificate } from '@/lib/actions/prisma-actions'
import { useRouter } from 'next/navigation'
import { normalizeString } from '@/lib/utils'
import { ArtworkFormProps, UseArtworkFormReturn } from './types'


export function useArtworkForm({
    mode = 'create',
    initialData = {},
    onSuccess,
    onTitleChange,
    onPricingOptionsChange
}: ArtworkFormProps): UseArtworkFormReturn {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [previewImages, setPreviewImages] = useState<string[]>([])
    const [previewCertificate, setPreviewCertificate] = useState<string | null>(null)
    const [previewPhysicalCertificate, setPreviewPhysicalCertificate] = useState<string | null>(null)
    const [previewNftCertificate, setPreviewNftCertificate] = useState<string | null>(null)
    const [numPages, setNumPages] = useState<number | null>(null)
    const [tags, setTags] = useState<string[]>([])
    const [hasIntellectualProperty, setHasIntellectualProperty] = useState(initialData?.intellectualProperty || false)
    const [slug, setSlug] = useState(initialData?.slug || '')
    const fileInputRef = useRef<HTMLInputElement>(null)
    const certificateInputRef = useRef<HTMLInputElement>(null)
    const physicalCertificateInputRef = useRef<HTMLInputElement>(null)
    const nftCertificateInputRef = useRef<HTMLInputElement>(null)
    const secondaryImagesInputRef = useRef<HTMLInputElement>(null)
    const [secondaryImages, setSecondaryImages] = useState<string[]>([])
    const [secondaryImagesFiles, setSecondaryImagesFiles] = useState<File[]>([])
    const { user } = useDynamicContext()
    const [formErrors, setFormErrors] = useState<any>(null)
    const isEditMode = mode === 'edit'
    const router = useRouter()
    const [hasExistingMainImage, setHasExistingMainImage] = useState(false)

    // Récupérer les fonctions toast et les stocker dans des variables pour éviter les problèmes de portée
    const toastContext = useToast()
    const { error: errorToast, success: successToast, info: infoToast, warning: warningToast, dismiss } = toastContext

    // Toast styling for errors
    const toastErrorOptions = {
        duration: 5000,
        position: 'top-center' as const,
        style: {
            background: '#FFEBEE',
            color: '#D32F2F',
            border: '1px solid #FFCDD2',
            fontWeight: 500,
            padding: '16px',
        },
        icon: '⚠️',
    }

    // Choose validation schema based on mode
    const validationSchema = isEditMode ? artworkEditSchema : artworkSchema

    // Form initialization
    const {
        register,
        handleSubmit,
        setValue,
        reset,
        watch,
        control,
        getValues,
        formState: { errors }
    } = useForm<ArtworkFormData>({
        resolver: zodResolver(validationSchema) as any,
        defaultValues: {
            name: initialData?.title || '',
            title: initialData?.title || '',
            description: initialData?.description || '',
            metaTitle: initialData?.metaTitle || '',
            metaDescription: initialData?.metaDescription || '',
            medium: initialData?.medium || '',
            mediumId: initialData?.mediumId?.toString() || '',
            styleId: initialData?.styleId?.toString() || '',
            techniqueId: initialData?.techniqueId?.toString() || '',
            width: initialData?.width || '',
            height: initialData?.height || '',
            weight: initialData?.weight || '',
            creationYear: initialData?.creationYear || new Date().getFullYear().toString(),
            intellectualProperty: initialData?.intellectualProperty || false,
            intellectualPropertyEndDate: initialData?.intellectualPropertyEndDate || '',
            images: undefined,
            physicalCertificate: undefined,
            nftCertificate: undefined,
            hasPhysicalOnly: initialData?.hasPhysicalOnly || false,
            hasNftOnly: initialData?.hasNftOnly || false,
            pricePhysicalBeforeTax: initialData?.pricePhysicalBeforeTax || '',
            priceNftBeforeTax: initialData?.priceNftBeforeTax || '',
            certificateUrl: initialData?.certificateUrl || '',
            physicalCertificateUrl: initialData?.physicalCertificateUrl || '',
            nftCertificateUrl: initialData?.nftCertificateUrl || '',
            initialQty: initialData?.initialQty?.toString() || '1',
            shippingAddressId: initialData?.shippingAddressId?.toString() || initialData?.physicalItem?.shippingAddressId?.toString() || '',
        }
    })

    // Watch form values
    const intellectualProperty = watch('intellectualProperty')
    const hasPhysicalOnly = watch('hasPhysicalOnly')
    const hasNftOnly = watch('hasNftOnly')
    const name = watch('name')
    const physicalCertificateUrl = watch('physicalCertificateUrl')
    const nftCertificateUrl = watch('nftCertificateUrl')

    // Callback for pricing option changes
    useEffect(() => {
        if (onPricingOptionsChange) {
            if (typeof onPricingOptionsChange === 'object') {
                if (onPricingOptionsChange.setHasPhysicalOnly) {
                    onPricingOptionsChange.setHasPhysicalOnly(Boolean(hasPhysicalOnly))
                }
                if (onPricingOptionsChange.setHasNftOnly) {
                    onPricingOptionsChange.setHasNftOnly(Boolean(hasNftOnly))
                }
            }
        }
    }, [hasPhysicalOnly, hasNftOnly, onPricingOptionsChange])

    // Callback for title changes
    useEffect(() => {
        if (onTitleChange && name) {
            onTitleChange(name)
        }
    }, [name, onTitleChange])

    // Function to check if an image is existing
    const isExistingImage = useCallback((src: string): boolean => {
        if (!src || !initialData || !initialData.secondaryImagesUrl) return false

        try {
            if (Array.isArray(initialData.secondaryImagesUrl)) {
                return initialData.secondaryImagesUrl.some(url => url === src)
            }

            if (typeof initialData.secondaryImagesUrl === 'string') {
                try {
                    const parsedUrls = JSON.parse(initialData.secondaryImagesUrl)
                    if (Array.isArray(parsedUrls)) {
                        return parsedUrls.some(url => url === src)
                    }
                } catch {
                    // Ignore parsing errors
                }
            }
        } catch (error) {
            console.error('Erreur dans isExistingImage:', error)
        }

        return false
    }, [initialData])

    // Update slug when title changes
    useEffect(() => {
        if (name) {
            setSlug(normalizeString(name))
        }
    }, [name])

    // Initialize images in edit mode
    useEffect(() => {
        if (isEditMode && initialData?.imageUrl) {
            setPreviewImages([initialData.imageUrl])
        }

        if (isEditMode && initialData?.secondaryImagesUrl) {
            let secondaryImagesArray: string[] = []

            if (Array.isArray(initialData.secondaryImagesUrl)) {
                secondaryImagesArray = initialData.secondaryImagesUrl
            } else if (typeof initialData.secondaryImagesUrl === 'string') {
                try {
                    const parsed = JSON.parse(initialData.secondaryImagesUrl)
                    if (Array.isArray(parsed)) {
                        secondaryImagesArray = parsed
                    }
                } catch (e) {
                    console.error('Erreur lors du parsing des images secondaires:', e)
                }
            }

            if (secondaryImagesArray.length > 0) {
                setSecondaryImages(secondaryImagesArray)
            }
        }
    }, [isEditMode, initialData])

    // Initialize certificate in edit mode
    useEffect(() => {
        if (isEditMode && initialData?.certificateUrl) {
            setPreviewCertificate(initialData.certificateUrl)
            setValue('certificateUrl', initialData.certificateUrl)
        }

        // Initialiser les certificats physiques et NFT existants
        if (isEditMode && initialData?.physicalCertificateUrl) {
            setPreviewPhysicalCertificate(initialData.physicalCertificateUrl)
            setValue('physicalCertificateUrl', initialData.physicalCertificateUrl)
        }

        if (isEditMode && initialData?.nftCertificateUrl) {
            setPreviewNftCertificate(initialData.nftCertificateUrl)
            setValue('nftCertificateUrl', initialData.nftCertificateUrl)
        }
    }, [isEditMode, initialData, setValue])

    // Disable image validation if existing image in edit mode
    useEffect(() => {
        if (isEditMode && initialData?.imageUrl && previewImages.length > 0) {
            setValue('images', null as any, { shouldValidate: false })
            setHasExistingMainImage(true)
        }
    }, [isEditMode, initialData, previewImages, setValue])

    // Update intellectual property state
    useEffect(() => {
        setHasIntellectualProperty(!!intellectualProperty)
    }, [intellectualProperty])

    // Display error toasts
    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors)

            const shouldIgnoreImageError = isEditMode && (initialData?.imageUrl || previewImages.length > 0)

            const fieldNames: Record<string, string> = {
                title: 'Nom',
                name: 'Nom',
                description: 'Description',
                pricePhysicalBeforeTax: 'Prix - Oeuvre physique',
                priceNftBeforeTax: 'Prix - NFT',
                pricingOption: 'Option de tarification',
                medium: 'Support/Medium',
                images: 'Image Principale',
                physicalCertificate: 'Certificat d\'authenticité physique',
                nftCertificate: 'Certificat d\'authenticité NFT',
                width: 'Largeur',
                height: 'Hauteur',
                weight: 'Poids',
                root: 'Général',
                physicalDimensions: 'Dimensions physiques (poids, largeur, hauteur)'
            }

            const hasPricingOptionError = errors.root?.message &&
                typeof errors.root.message === 'string' &&
                errors.root.message.includes("option de tarification")

            const hasPhysicalDimensionsError = errors.root?.message &&
                typeof errors.root.message === 'string' &&
                errors.root.message.includes("dimensions")

            const hasPriceError = errors.pricePhysicalBeforeTax?.message ||
                errors.priceNftBeforeTax?.message

            if (hasPricingOptionError && errors.root?.message) {
                errorToast(String(errors.root.message))
            } else if (hasPriceError) {
                if (errors.pricePhysicalBeforeTax?.message) {
                    errorToast(String(errors.pricePhysicalBeforeTax.message))
                } else if (errors.priceNftBeforeTax?.message) {
                    errorToast(String(errors.priceNftBeforeTax.message))
                }
            } else if (hasPhysicalDimensionsError && errors.root?.message) {
                errorToast(String(errors.root.message))
            } else {
                const missingFields = Object.keys(errors)
                    .filter(key => key !== 'images' || !shouldIgnoreImageError)
                    .map(key => fieldNames[key])
                    .filter(Boolean)

                if (missingFields.length > 0) {
                    errorToast(`Champs obligatoires manquants : ${missingFields.join(', ')}`)
                }
            }

            const firstError = Object.keys(errors)[0]
            const element = document.getElementById(firstError)
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                element.focus()
            }
        } else {
            setFormErrors(null)
        }
    }, [errors, isEditMode, initialData?.imageUrl, previewImages.length, errorToast])

    // Handle main image change
    const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return

        const imageFiles = Array.from(files)
        const maxSizeInBytes = 800 * 1024 // 800 KB pour l'image principale
        const imageUrls: string[] = []

        // Vérifier la taille de chaque fichier
        for (const file of imageFiles) {
            if (file.size > maxSizeInBytes) {
                errorToast(`L'image "${file.name}" dépasse la taille maximale autorisée de 800 KB (taille actuelle: ${(file.size / (1024 * 1024)).toFixed(2)} MB)`)
                if (fileInputRef.current) {
                    fileInputRef.current.value = ''
                }
                return
            }
        }

        imageFiles.forEach(file => {
            const url = URL.createObjectURL(file)
            imageUrls.push(url)
        })

        setPreviewImages(imageUrls)
    }, [errorToast])

    // Handle secondary images change
    const handleSecondaryImagesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return

        const newImageFiles = Array.from(files)
        const maxSizeInBytes = 500 * 1024 // 500 KB pour les images secondaires  
        const newImageUrls: string[] = []

        // Vérifier la taille de chaque fichier
        for (const file of newImageFiles) {
            if (file.size > maxSizeInBytes) {
                errorToast(`L'image "${file.name}" dépasse la taille maximale autorisée de 500 KB (taille actuelle: ${(file.size / (1024 * 1024)).toFixed(2)} MB)`)
                if (secondaryImagesInputRef.current) {
                    secondaryImagesInputRef.current.value = ''
                }
                return
            }
        }

        newImageFiles.forEach(file => {
            const url = URL.createObjectURL(file)
            newImageUrls.push(url)
        })

        setSecondaryImages(prev => [...prev, ...newImageUrls])
        setSecondaryImagesFiles(prev => [...prev, ...newImageFiles])
    }, [errorToast])

    // Handle certificate change
    const handleCertificateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) {
            setPreviewCertificate(null)
            setValue('physicalCertificate', null as any, { shouldValidate: true })
            return
        }

        const file = files[0]
        if (file.type !== 'application/pdf') {
            errorToast('Seuls les fichiers PDF sont acceptés pour le certificat d\'authenticité')
            if (certificateInputRef.current) {
                certificateInputRef.current.value = ''
            }
            setPreviewCertificate(null)
            setValue('physicalCertificate', null as any, { shouldValidate: true })
            return
        }

        const url = URL.createObjectURL(file)
        setPreviewCertificate(url)

        setValue('physicalCertificate', e.target.files as unknown as FileList, { shouldValidate: true })
    }, [setValue, errorToast])

    // Handle physical certificate change
    const handlePhysicalCertificateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) {
            setPreviewPhysicalCertificate(null)
            setValue('physicalCertificate', null as any, { shouldValidate: true })
            return
        }

        const file = files[0]
        const maxPdfSizeInBytes = 2 * 1024 * 1024 // 2 MB pour les PDFs

        if (file.type !== 'application/pdf') {
            errorToast('Seuls les fichiers PDF sont acceptés pour le certificat d\'œuvre physique')
            if (physicalCertificateInputRef.current) {
                physicalCertificateInputRef.current.value = ''
            }
            setPreviewPhysicalCertificate(null)
            setValue('physicalCertificate', null as any, { shouldValidate: true })
            return
        }

        if (file.size > maxPdfSizeInBytes) {
            errorToast(`Le certificat PDF "${file.name}" dépasse la taille maximale autorisée de 2 MB (taille actuelle: ${(file.size / (1024 * 1024)).toFixed(2)} MB)`)
            if (physicalCertificateInputRef.current) {
                physicalCertificateInputRef.current.value = ''
            }
            setPreviewPhysicalCertificate(null)
            setValue('physicalCertificate', null as any, { shouldValidate: true })
            return
        }

        const url = URL.createObjectURL(file)
        setPreviewPhysicalCertificate(url)

        setValue('physicalCertificate', e.target.files as unknown as FileList, { shouldValidate: true })
    }, [setValue, errorToast])

    // Handle NFT certificate change
    const handleNftCertificateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) {
            setPreviewNftCertificate(null)
            setValue('nftCertificate', null as any, { shouldValidate: true })
            return
        }

        const file = files[0]
        const maxPdfSizeInBytes = 2 * 1024 * 1024 // 2 MB pour les PDFs

        if (file.type !== 'application/pdf') {
            errorToast('Seuls les fichiers PDF sont acceptés pour le certificat NFT')
            if (nftCertificateInputRef.current) {
                nftCertificateInputRef.current.value = ''
            }
            setPreviewNftCertificate(null)
            setValue('nftCertificate', null as any, { shouldValidate: true })
            return
        }

        if (file.size > maxPdfSizeInBytes) {
            errorToast(`Le certificat PDF "${file.name}" dépasse la taille maximale autorisée de 2 MB (taille actuelle: ${(file.size / (1024 * 1024)).toFixed(2)} MB)`)
            if (nftCertificateInputRef.current) {
                nftCertificateInputRef.current.value = ''
            }
            setPreviewNftCertificate(null)
            setValue('nftCertificate', null as any, { shouldValidate: true })
            return
        }

        const url = URL.createObjectURL(file)
        setPreviewNftCertificate(url)

        setValue('nftCertificate', e.target.files as unknown as FileList, { shouldValidate: true })
    }, [setValue, errorToast])

    // Remove secondary image
    const removeSecondaryImage = useCallback(async (index: number) => {
        try {
            if (isEditMode && initialData?.id) {
                const imageUrl = secondaryImages[index]

                if (isExistingImage(imageUrl)) {
                    setIsSubmitting(true)

                    const loadingToast = infoToast('Suppression de l\'image en cours...')

                    try {
                        const { deleteImageFromFirebase } = await import('@/lib/firebase/storage')
                        const storageDeleted = await deleteImageFromFirebase(imageUrl)

                        if (!storageDeleted) {
                            console.error('Erreur lors de la suppression de l\'image dans Firebase Storage')
                        }

                        const { removeSecondaryImage: deleteImageFromDb } = await import('@/lib/actions/prisma-actions')
                        await deleteImageFromDb(initialData.id, imageUrl)

                        dismiss(loadingToast as any)
                        successToast('Image supprimée avec succès')

                        setSecondaryImages(prev => prev.filter((_, i) => i !== index))
                        setSecondaryImagesFiles(prev => prev.filter((_, i) => i !== index))
                    } catch (error) {
                        dismiss(loadingToast as any)
                        console.error('Erreur lors de la suppression de l\'image:', error)
                        errorToast('Erreur lors de la suppression de l\'image')
                    } finally {
                        setIsSubmitting(false)
                    }
                } else {
                    setSecondaryImages(prev => prev.filter((_, i) => i !== index))
                    setSecondaryImagesFiles(prev => prev.filter((_, i) => i !== index))
                }
            } else {
                setSecondaryImages(prev => prev.filter((_, i) => i !== index))
                setSecondaryImagesFiles(prev => prev.filter((_, i) => i !== index))
            }
        } catch (error) {
            console.error('Erreur lors de la suppression de l\'image:', error)
            errorToast('Erreur lors de la suppression de l\'image')
        }
    }, [isEditMode, initialData, secondaryImages, isExistingImage, infoToast, successToast, errorToast, dismiss])

    // Handle PDF document load
    const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
        setNumPages(numPages)
    }, [])

    // Reset form
    const handleResetForm = useCallback(() => {
        reset()
        setPreviewImages([])
        setPreviewCertificate(null)
        setTags([])
        setSecondaryImages([])
        setSecondaryImagesFiles([])
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
        if (certificateInputRef.current) {
            certificateInputRef.current.value = ''
        }
        if (secondaryImagesInputRef.current) {
            secondaryImagesInputRef.current.value = ''
        }
    }, [reset])

    // Async function to handle uploads
    const handleUpload = async (data: ArtworkFormData, backofficeUser: any, isRealNewImage: boolean) => {
        // S'assurer que les fonctions toast sont disponibles dans cette portée
        const { error: errorToastFn, success: successToastFn, info: infoToastFn } = toastContext

        let mainImageUrl = initialData?.imageUrl || ''
        let newSecondaryImageUrls: string[] = []

        const hasNewSecondaryImages = secondaryImagesFiles.length > 0

        if (isRealNewImage || hasNewSecondaryImages) {
            try {
                const artistName = backofficeUser.artist
                    ? `${backofficeUser.artist.name} ${backofficeUser.artist.surname}`.trim()
                    : `${backofficeUser.firstName} ${backofficeUser.lastName}`.trim()

                const artistFolder = backofficeUser.artist
                    ? `${backofficeUser.artist.name.toLowerCase()}${backofficeUser.artist.surname.toLowerCase()}`
                    : `${backofficeUser.firstName?.toLowerCase() || ''}${backofficeUser.lastName?.toLowerCase() || ''}`

                const itemSlug = slug || (data.title ? normalizeString(data.title) : '')

                const { getAuth, signInAnonymously } = await import('firebase/auth')
                const { app } = await import('@/lib/firebase/config')
                const { uploadImageToFirebase, uploadMultipleImagesToFirebase, deleteImageFromFirebase } = await import('@/lib/firebase/storage')

                const auth = getAuth(app)
                const userCredential = await signInAnonymously(auth)

                if (isRealNewImage && fileInputRef.current && fileInputRef.current.files && fileInputRef.current.files.length > 0) {
                    if (initialData?.imageUrl) {
                        infoToastFn('Remplacement de l\'image principale en cours...')

                        try {
                            await deleteImageFromFirebase(initialData.imageUrl)
                        } catch (deleteError) {
                            console.error('Erreur lors de la suppression de l\'ancienne image:', deleteError)
                        }
                    }

                    mainImageUrl = await uploadImageToFirebase(fileInputRef.current.files[0], {
                        artistFolder,
                        itemSlug,
                        isMain: true
                    })

                    successToastFn('Nouvelle image uploadée avec succès')
                }

                if (hasNewSecondaryImages && secondaryImagesFiles.length > 0) {
                    newSecondaryImageUrls = await uploadMultipleImagesToFirebase(secondaryImagesFiles, {
                        artistFolder,
                        itemSlug,
                        isMain: false
                    })
                }

                // Récupérer les URLs d'images secondaires existantes
                let existingSecondaryImageUrls: string[] = []

                if (initialData?.secondaryImagesUrl) {
                    if (Array.isArray(initialData.secondaryImagesUrl)) {
                        existingSecondaryImageUrls = initialData.secondaryImagesUrl
                    } else if (typeof initialData.secondaryImagesUrl === 'string') {
                        try {
                            const parsed = JSON.parse(initialData.secondaryImagesUrl)
                            if (Array.isArray(parsed)) {
                                existingSecondaryImageUrls = parsed
                            }
                        } catch (e) {
                            console.error('Erreur lors du parsing des images secondaires existantes:', e)
                        }
                    }
                }

                const currentExistingUrls = existingSecondaryImageUrls.filter(url =>
                    secondaryImages.includes(url)
                )

                const allSecondaryImageUrls = [...currentExistingUrls, ...newSecondaryImageUrls]

                if (isEditMode && initialData?.id) {
                    const { saveItemImages } = await import('@/lib/actions/prisma-actions')
                    await saveItemImages(
                        initialData.id as number,
                        isRealNewImage ? mainImageUrl : undefined,
                        allSecondaryImageUrls
                    )
                }

                return { mainImageUrl, allSecondaryImageUrls }
            } catch (uploadError) {
                console.error('Erreur lors de l\'upload des images:', uploadError)
                errorToastFn('Erreur lors de l\'upload des images')
                throw uploadError
            }
        }

        return { mainImageUrl, allSecondaryImageUrls: [] }
    }

    // Form submit handler
    const onSubmit = async (data: ArtworkFormData) => {
        setIsSubmitting(true)

        try {
            if (!user?.email) {
                throw new Error('Vous devez être connecté pour créer ou modifier une œuvre')
            }

            const backofficeUser = await getBackofficeUserByEmail(user.email)

            if (!backofficeUser) {
                throw new Error('Utilisateur non trouvé dans le backoffice')
            }

            // Debug: vérifier la valeur de artistId
            console.log('DEBUG backofficeUser:', {
                id: backofficeUser.id,
                email: backofficeUser.email,
                artistId: backofficeUser.artistId,
                artist: backofficeUser.artist
            })

            if (isEditMode && initialData?.id) {
                // En mode édition : validation côté serveur pour les certificats
                const hasNewPhysicalCertificate = data.physicalCertificate && data.physicalCertificate instanceof FileList && data.physicalCertificate.length > 0
                const hasNewNftCertificate = data.nftCertificate && data.nftCertificate instanceof FileList && data.nftCertificate.length > 0
                const hasExistingPhysicalCertificate = !!initialData?.physicalCertificateUrl
                const hasExistingNftCertificate = !!initialData?.nftCertificateUrl

                // Validation côté serveur pour les certificats
                if (data.hasPhysicalOnly && !hasNewPhysicalCertificate && !hasExistingPhysicalCertificate) {
                    errorToast('Le certificat d\'œuvre physique est obligatoire')
                    setIsSubmitting(false)
                    return
                }

                if (data.hasNftOnly && !hasNewNftCertificate && !hasExistingNftCertificate) {
                    errorToast('Le certificat NFT est obligatoire')
                    setIsSubmitting(false)
                    return
                }

                try {
                    setIsSubmitting(true)

                    const loadingToast = infoToast('Mise à jour de l\'œuvre en cours...')

                    const isRealNewImage = fileInputRef.current &&
                        fileInputRef.current.files &&
                        fileInputRef.current.files.length > 0

                    const { mainImageUrl } = await handleUpload(data, backofficeUser, isRealNewImage as boolean)

                    // Récupérer l'artistId admin si l'utilisateur est admin
                    const adminSelectedArtistId = typeof window !== 'undefined'
                        ? localStorage.getItem('adminSelectedArtistId')
                        : null
                    const finalArtistId = adminSelectedArtistId
                        ? parseInt(adminSelectedArtistId)
                        : (backofficeUser.artistId || null)

                    // Données de base de l'Item
                    const updateData: any = {
                        name: data.name,
                        metaTitle: data.metaTitle,
                        metaDescription: data.metaDescription,
                        description: data.description || '',
                        slug: slug || normalizeString(data.name),
                        tags: tags,
                        artistId: finalArtistId,
                    }

                    // Mise à jour des propriétés spécifiques selon le type d'œuvre
                    if (data.hasPhysicalOnly) {
                        updateData.physicalItemData = {
                            price: data.pricePhysicalBeforeTax ? parseInt(data.pricePhysicalBeforeTax, 10) : 0,
                            initialQty: data.initialQty ? parseInt(data.initialQty, 10) : 1,
                            height: data.height ? parseFloat(data.height) : undefined,
                            width: data.width ? parseFloat(data.width) : undefined,
                            weight: data.weight ? parseFloat(data.weight) : undefined,
                            creationYear: data.creationYear ? parseInt(data.creationYear, 10) : null,
                            shippingAddressId: data.shippingAddressId ? parseInt(data.shippingAddressId, 10) : undefined,
                        }
                    }

                    if (data.hasNftOnly) {
                        updateData.nftItemData = {
                            price: data.priceNftBeforeTax ? parseInt(data.priceNftBeforeTax, 10) : 0,
                        }
                    }

                    // Ajouter les caractéristiques artistiques à l'Item principal
                    if (data.mediumId) updateData.mediumId = parseInt(data.mediumId, 10)
                    if (data.styleId) updateData.styleId = parseInt(data.styleId, 10)
                    if (data.techniqueId) updateData.techniqueId = parseInt(data.techniqueId, 10)

                    if (isRealNewImage && mainImageUrl && mainImageUrl !== initialData.imageUrl) {
                        updateData.mainImageUrl = mainImageUrl
                    }

                    const result = await updateItemRecord(
                        initialData.id,
                        updateData
                    )

                    if (result.success) {
                        // Sauvegarder le certificat d'œuvre physique seulement si un nouveau fichier est fourni
                        if (data.hasPhysicalOnly && hasNewPhysicalCertificate) {
                            const certificateFile = data.physicalCertificate![0]
                            const arrayBuffer = await certificateFile.arrayBuffer()
                            const buffer = new Uint8Array(arrayBuffer)
                            await savePhysicalCertificate(initialData.id, buffer)
                        }

                        // Sauvegarder le certificat NFT seulement si un nouveau fichier est fourni
                        if (data.hasNftOnly && hasNewNftCertificate) {
                            const certificateFile = data.nftCertificate![0]
                            const arrayBuffer = await certificateFile.arrayBuffer()
                            const buffer = new Uint8Array(arrayBuffer)
                            await saveNftCertificate(initialData.id, buffer)
                        }

                        dismiss(loadingToast as any)
                        successToast(`L'œuvre "${data.name}" a été mise à jour avec succès!`)

                        if (onSuccess) {
                            onSuccess()
                        }
                    } else {
                        dismiss(loadingToast as any)
                        errorToast(`Erreur lors de la mise à jour: ${result.message || 'Une erreur est survenue'}`)
                    }
                } catch (error: any) {
                    console.error('Erreur lors de la mise à jour de l\'œuvre:', error)
                    errorToast(error.message || 'Une erreur est survenue lors de la mise à jour')
                }
            } else {
                // Mode création : utiliser la validation Zod côté client (comportement existant)
                const validationResult = artworkSchema.safeParse(data)

                if (!validationResult.success) {
                    console.error('Erreurs de validation:', validationResult.error.errors)
                    const firstError = validationResult.error.errors[0]
                    errorToast(firstError.message)
                    setIsSubmitting(false)
                    return
                }

                try {
                    // Upload des images vers Firebase Storage
                    const isRealNewImage = fileInputRef.current &&
                        fileInputRef.current.files &&
                        fileInputRef.current.files.length > 0

                    const { mainImageUrl, allSecondaryImageUrls } = await handleUpload(data, backofficeUser, isRealNewImage as boolean)

                    // Récupérer l'artistId admin si l'utilisateur est admin
                    const adminSelectedArtistId = typeof window !== 'undefined'
                        ? localStorage.getItem('adminSelectedArtistId')
                        : null
                    const finalArtistId = adminSelectedArtistId
                        ? parseInt(adminSelectedArtistId)
                        : (backofficeUser.artistId || null)

                    // Données de base pour la création d'Item
                    const itemBaseData = {
                        name: data.name,
                        metaTitle: data.metaTitle,
                        metaDescription: data.metaDescription,
                        description: data.description || '',
                        slug: slug || normalizeString(data.name),
                        mainImageUrl: mainImageUrl || null,
                        artistId: finalArtistId,
                        mediumId: data.mediumId ? parseInt(data.mediumId, 10) : undefined,
                        styleId: data.styleId ? parseInt(data.styleId, 10) : undefined,
                        techniqueId: data.techniqueId ? parseInt(data.techniqueId, 10) : undefined,
                    }

                    // Debug: vérifier les données envoyées
                    console.log('DEBUG itemBaseData:', itemBaseData)

                    // Données pour PhysicalItem, si applicable
                    const physicalItemData = data.hasPhysicalOnly ? {
                        price: data.pricePhysicalBeforeTax ? parseInt(data.pricePhysicalBeforeTax, 10) : 0,
                        initialQty: data.initialQty ? parseInt(data.initialQty, 10) : 1,
                        height: data.height ? parseFloat(data.height) : undefined,
                        width: data.width ? parseFloat(data.width) : undefined,
                        weight: data.weight ? parseFloat(data.weight) : undefined,
                        creationYear: data.creationYear ? parseInt(data.creationYear, 10) : null,
                        shippingAddressId: data.shippingAddressId ? parseInt(data.shippingAddressId, 10) : undefined,
                    } : null

                    // Données pour NftItem, si applicable
                    const nftItemData = data.hasNftOnly ? {
                        price: data.priceNftBeforeTax ? parseInt(data.priceNftBeforeTax, 10) : 0,
                    } : null

                    // Créer l'enregistrement de l'œuvre avec les types appropriés
                    const newItem = await createItemRecord(
                        backofficeUser.id,
                        'created',
                        tags,
                        itemBaseData,
                        physicalItemData,
                        nftItemData
                    )

                    if (newItem && newItem.item && newItem.item.id) {
                        // Sauvegarder le certificat d'œuvre physique
                        if (data.hasPhysicalOnly && data.physicalCertificate && data.physicalCertificate instanceof FileList && data.physicalCertificate.length > 0) {
                            const certificateFile = data.physicalCertificate[0]
                            const arrayBuffer = await certificateFile.arrayBuffer()
                            const buffer = new Uint8Array(arrayBuffer)
                            await savePhysicalCertificate(newItem.item.id, buffer)
                        }

                        // Sauvegarder le certificat NFT
                        if (data.hasNftOnly && data.nftCertificate && data.nftCertificate instanceof FileList && data.nftCertificate.length > 0) {
                            const certificateFile = data.nftCertificate[0]
                            const arrayBuffer = await certificateFile.arrayBuffer()
                            const buffer = new Uint8Array(arrayBuffer)
                            await saveNftCertificate(newItem.item.id, buffer)
                        }

                        if (mainImageUrl || allSecondaryImageUrls.length > 0) {
                            const { saveItemImages } = await import('@/lib/actions/prisma-actions')
                            await saveItemImages(newItem.item.id, mainImageUrl, allSecondaryImageUrls)
                        }
                    }

                    successToast(`L'œuvre "${data.name}" a été créée avec succès!`)

                    if (onSuccess) {
                        onSuccess()
                    } else {
                        handleResetForm()
                    }
                } catch (error: any) {
                    console.error('Erreur lors de la création de l\'œuvre:', error)
                    errorToast(error.message || 'Une erreur est survenue lors de la création')
                }
            }
        } catch (error: any) {
            console.error('Erreur lors de la soumission du formulaire:', error)
            errorToast(error.message || 'Une erreur est survenue')
        } finally {
            setIsSubmitting(false)
        }
    }

    return {
        isSubmitting,
        previewImages,
        previewCertificate,
        previewPhysicalCertificate,
        previewNftCertificate,
        numPages,
        tags,
        hasIntellectualProperty,
        slug,
        secondaryImages,
        secondaryImagesFiles,
        formErrors,
        isEditMode,
        hasExistingMainImage,
        fileInputRef: fileInputRef as RefObject<HTMLInputElement>,
        certificateInputRef: certificateInputRef as RefObject<HTMLInputElement>,
        physicalCertificateInputRef: physicalCertificateInputRef as RefObject<HTMLInputElement>,
        nftCertificateInputRef: nftCertificateInputRef as RefObject<HTMLInputElement>,
        secondaryImagesInputRef: secondaryImagesInputRef as RefObject<HTMLInputElement>,
        handleImageChange,
        handleSecondaryImagesChange,
        removeSecondaryImage,
        handleCertificateChange,
        handlePhysicalCertificateChange,
        handleNftCertificateChange,
        onDocumentLoadSuccess,
        handleResetForm,
        onSubmit,
        isExistingImage,
        handleSubmit,
        formState: { errors },
        toastErrorOptions,
        setTags,
        register,
        setValue,
        control,
        getValues
    }
} 