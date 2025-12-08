'use client'

import { useState, useRef, useEffect, useCallback, RefObject } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

import { physicalArtworkSchema, physicalArtworkEditSchema, PhysicalArtworkFormData } from '../../createPhysicalArtwork/schema'
import { useToast } from '@/app/components/Toast/ToastContext'
import { authClient } from '@/lib/auth-client'
import { getBackofficeUserByEmail, createItemRecord, updateItemRecord, savePhysicalCertificate, saveNftCertificate } from '@/lib/actions/prisma-actions'
import { useRouter } from 'next/navigation'
import { normalizeString } from '@/lib/utils'
import { ArtworkFormProps, UseArtworkFormReturn } from './types'


export function useArtworkForm({
    mode = 'create',
    initialData = {},
    onSuccess,
    onTitleChange,
    onPricingOptionsChange,
    isPhysicalOnly = false,
    progressCallbacks
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
    // Ref pour stocker les fichiers en attente d'upload par type (non sérialisables dans le formulaire)
    const pendingImagesByTypeRef = useRef<Record<string, File[]>>({})
    // Ref pour stocker les URLs d'images existantes à supprimer (par type)
    const removedImagesByTypeRef = useRef<Record<string, string[]>>({})
    const { data: session } = authClient.useSession()
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

    // Choose validation schema based on mode and isPhysicalOnly
    const validationSchema = isPhysicalOnly
        ? (isEditMode ? physicalArtworkEditSchema : physicalArtworkSchema)
        : (isEditMode ? physicalArtworkEditSchema : physicalArtworkSchema)

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
    } = useForm<PhysicalArtworkFormData>({
        resolver: zodResolver(validationSchema as any) as any, // Cast nécessaire due aux validations conditionnelles Zod complexes
        mode: 'onSubmit', // Validation uniquement à la soumission
        reValidateMode: 'onChange', // Re-validation après erreur
        defaultValues: {
            name: initialData?.title || '',
            title: initialData?.title || '',
            description: initialData?.description || '',
            metaTitle: initialData?.metaTitle || '',
            metaDescription: initialData?.metaDescription || '',
            medium: initialData?.medium || '',
            mediumId: initialData?.physicalItem?.mediumId?.toString() || initialData?.mediumId?.toString() || '',
            styleIds: (initialData?.styleIds && initialData.styleIds.length > 0)
                ? initialData.styleIds
                : (initialData?.physicalItem?.itemStyles && initialData.physicalItem.itemStyles.length > 0)
                    ? initialData.physicalItem.itemStyles.map(is => is.styleId)
                    : [] as (string | number)[],
            techniqueIds: (initialData?.techniqueIds && initialData.techniqueIds.length > 0)
                ? initialData.techniqueIds
                : (initialData?.physicalItem?.itemTechniques && initialData.physicalItem.itemTechniques.length > 0)
                    ? initialData.physicalItem.itemTechniques.map(it => it.techniqueId)
                    : [] as (string | number)[],
            themeIds: initialData?.themeIds || initialData?.physicalItem?.itemThemes?.map(ith => ith.themeId) || [] as (string | number)[],
            width: initialData?.width || '',
            height: initialData?.height || '',
            weight: initialData?.weight || '',
            creationYear: initialData?.creationYear || new Date().getFullYear().toString(),
            intellectualProperty: initialData?.intellectualProperty || false,
            intellectualPropertyEndDate: initialData?.intellectualPropertyEndDate || '',
            images: undefined,
            physicalCertificate: undefined,
            hasPhysicalOnly: isPhysicalOnly || initialData?.hasPhysicalOnly || false,    // TODO: Check if this is correct
            pricePhysicalBeforeTax: initialData?.pricePhysicalBeforeTax || '',
            certificateUrl: initialData?.certificateUrl || '',
            physicalCertificateUrl: initialData?.physicalCertificateUrl || '',
            shippingAddressId: initialData?.shippingAddressId?.toString() || initialData?.physicalItem?.shippingAddressId?.toString() || '',
            initialQty: initialData?.initialQty?.toString() || '1',
            physicalCollectionId: (initialData?.physicalItem as any)?.physicalCollectionId?.toString() || '',
            mainImageUrl: initialData?.imageUrl || '',
        }
    })

    // Watch form values
    const intellectualProperty = watch('intellectualProperty')
    const hasPhysicalOnly = watch('hasPhysicalOnly')
    const name = watch('name')
    const physicalCertificateUrl = watch('physicalCertificateUrl')

    // Callback for pricing option changes
    useEffect(() => {
        if (onPricingOptionsChange) {
            if (typeof onPricingOptionsChange === 'object') {
                if (onPricingOptionsChange.setHasPhysicalOnly) {
                    onPricingOptionsChange.setHasPhysicalOnly(Boolean(hasPhysicalOnly))
                }
            }
        }
    }, [hasPhysicalOnly, onPricingOptionsChange])

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
            setValue('nftCertificateUrl' as any, initialData.nftCertificateUrl)
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
                pricingOption: 'Option de tarification',
                medium: 'Support/Medium',
                images: 'Image Principale',
                physicalCertificate: 'Certificat d\'authenticité physique',
                width: 'Largeur',
                height: 'Hauteur',
                weight: 'Poids',
                root: 'Général',
                physicalDimensions: 'Dimensions physiques (poids, largeur, hauteur)',
                physicalCollectionId: 'Collection'
            }

            const hasPricingOptionError = errors.root?.message &&
                typeof errors.root.message === 'string' &&
                errors.root.message.includes("option de tarification")

            const hasPhysicalDimensionsError = errors.root?.message &&
                typeof errors.root.message === 'string' &&
                errors.root.message.includes("dimensions")

            // Les erreurs de validation sont maintenant affichées dans la modale
            // Plus besoin de toasts d'erreur ici

            const firstError = Object.keys(errors)[0]
            const element = document.getElementById(firstError)
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' })
                element.focus()
            }
        } else {
            setFormErrors(null)
        }
    }, [errors, isEditMode, initialData?.imageUrl, previewImages.length])

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
            setValue('nftCertificate' as any, null as any, { shouldValidate: true })
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
            setValue('nftCertificate' as any, null as any, { shouldValidate: true })
            return
        }

        if (file.size > maxPdfSizeInBytes) {
            errorToast(`Le certificat PDF "${file.name}" dépasse la taille maximale autorisée de 2 MB (taille actuelle: ${(file.size / (1024 * 1024)).toFixed(2)} MB)`)
            if (nftCertificateInputRef.current) {
                nftCertificateInputRef.current.value = ''
            }
            setPreviewNftCertificate(null)
            setValue('nftCertificate' as any, null as any, { shouldValidate: true })
            return
        }

        const url = URL.createObjectURL(file)
        setPreviewNftCertificate(url)

        setValue('nftCertificate' as any, e.target.files as unknown as FileList, { shouldValidate: true })
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
    const handleUpload = async (data: PhysicalArtworkFormData, backofficeUser: any, isRealNewImage: boolean) => {
        // S'assurer que les fonctions toast sont disponibles dans cette portée
        const { error: errorToastFn, success: successToastFn, info: infoToastFn } = toastContext

        // Si mainImageUrl est déjà défini (via FirebaseImageUpload), l'utiliser directement
        let mainImageUrl = data.mainImageUrl || initialData?.imageUrl || ''
        let newSecondaryImageUrls: string[] = []

        const hasNewSecondaryImages = secondaryImagesFiles.length > 0

        // Si mainImageUrl n'est pas défini et qu'on a un fichier à uploader, utiliser l'ancien système
        if ((!mainImageUrl && isRealNewImage) || hasNewSecondaryImages) {
            try {
                const artistName = backofficeUser.artist
                    ? `${backofficeUser.artist.name} ${backofficeUser.artist.surname}`.trim()
                    : backofficeUser.name || ''

                const artistFolder = backofficeUser.artist
                    ? `${backofficeUser.artist.name.toLowerCase()}${backofficeUser.artist.surname.toLowerCase()}`
                    : (backofficeUser.name?.toLowerCase() || '').replace(/\s+/g, '')

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

                    // Utiliser uploadImageToMarketplaceFolder au lieu de uploadImageToFirebase
                    const { uploadImageToMarketplaceFolder } = await import('@/lib/firebase/storage')

                    // Créer le nom du répertoire avec la casse exacte (Prenom Nom)
                    const folderName = artistName
                        .normalize('NFD')
                        .replace(/[\u0300-\u036f]/g, '') // Supprime les accents
                        .replace(/[^a-zA-Z0-9\s]+/g, '') // Supprime les caractères spéciaux sauf espaces
                        .trim()

                    // Normaliser le nom de l'œuvre pour le nom de fichier
                    const fileName = normalizeString(data.name || `artwork-${Date.now()}`)

                    // Upload vers Firebase avec les callbacks de progression
                    progressCallbacks?.onProgressUpdate?.('upload', 'in-progress')
                    mainImageUrl = await uploadImageToMarketplaceFolder(
                        fileInputRef.current.files[0],
                        folderName,
                        fileName,
                        (status, error) => {
                            if (status === 'error') {
                                progressCallbacks?.onProgressUpdate?.('upload', 'error', error)
                            } else if (status === 'completed') {
                                progressCallbacks?.onProgressUpdate?.('upload', 'completed')
                            }
                        },
                        (status, error) => {
                            if (status === 'error') {
                                progressCallbacks?.onProgressUpdate?.('upload', 'error', error)
                            } else if (status === 'completed') {
                                progressCallbacks?.onProgressUpdate?.('upload', 'completed')
                            }
                        }
                    )

                    successToastFn('Nouvelle image uploadée avec succès')
                }

                if (hasNewSecondaryImages && secondaryImagesFiles.length > 0) {
                    // Import de la fonction de conversion WebP pour les images multiples
                    const { convertMultipleToWebP } = await import('@/lib/utils/webp-converter')

                    // Convertir les images secondaires en WebP si nécessaire
                    infoToastFn(`Traitement de ${secondaryImagesFiles.length} image(s) secondaire(s)...`)
                    const conversionResults = await convertMultipleToWebP(secondaryImagesFiles)

                    // Extraire les fichiers convertis
                    const processedFiles: File[] = []
                    let convertedCount = 0
                    let failedCount = 0

                    for (const result of conversionResults) {
                        processedFiles.push(result.file)

                        if (result.success && result.wasConverted) {
                            convertedCount++
                        } else if (!result.success) {
                            failedCount++
                            console.warn(`Échec de conversion pour une image secondaire: ${result.error}`)
                        }
                    }

                    if (convertedCount > 0) {
                        successToastFn(`${convertedCount} image(s) secondaire(s) convertie(s) en WebP`)
                    }

                    if (failedCount > 0) {
                        infoToastFn(`${failedCount} image(s) uploadée(s) dans leur format original`)
                    }

                    newSecondaryImageUrls = await uploadMultipleImagesToFirebase(processedFiles, {
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
    const onSubmit = async (data: PhysicalArtworkFormData) => {
        console.log('onSubmit - data reçue:', data);
        console.log('onSubmit - styleIds:', data.styleIds, 'techniqueIds:', data.techniqueIds);
        setIsSubmitting(true)

        try {
            if (!session?.user?.email) {
                throw new Error('Vous devez être connecté pour créer ou modifier une œuvre')
            }

            const backofficeUser = await getBackofficeUserByEmail(session.user.email)

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
                // En mode édition : le certificat d'œuvre physique n'est plus obligatoire
                // Vérifier si un nouveau certificat est fourni (même logique qu'en mode création)
                const hasNewPhysicalCertificate = data.physicalCertificate && data.physicalCertificate instanceof FileList && data.physicalCertificate.length > 0

                try {
                    setIsSubmitting(true)

                    const loadingToast = infoToast('Mise à jour de l\'œuvre en cours...')

                    // Vérifier si on a une nouvelle image (soit via Firebase, soit via input file)
                    const hasFirebaseImage = !!data.mainImageUrl && data.mainImageUrl !== initialData?.imageUrl
                    const isRealNewImage = hasFirebaseImage || (fileInputRef.current &&
                        fileInputRef.current.files &&
                        fileInputRef.current.files.length > 0)

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
                            // Caractéristiques artistiques (maintenant dans PhysicalItem)
                            mediumId: data.mediumId ? parseInt(data.mediumId, 10) : undefined,
                            supportId: data.supportId ? parseInt(data.supportId, 10) : undefined,
                            styleIds: data.styleIds ? data.styleIds.map(id => typeof id === 'string' ? parseInt(id, 10) : id) : undefined,
                            techniqueIds: data.techniqueIds ? data.techniqueIds.map(id => typeof id === 'string' ? parseInt(id, 10) : id) : undefined,
                            themeIds: data.themeIds ? data.themeIds.map(id => typeof id === 'string' ? parseInt(id, 10) : id) : undefined,
                        }
                    }


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

                        // Uploader les images par type si des fichiers sont en attente
                        // Récupérer depuis la ref car les File ne sont pas sérialisables dans le formulaire
                        const pendingImagesByType = pendingImagesByTypeRef.current
                        console.log('📸 Fichiers en attente d\'upload par type:', pendingImagesByType)

                        if (pendingImagesByType && Object.keys(pendingImagesByType).length > 0 && result.item?.physicalItem?.id) {
                            const physicalItemId = BigInt(result.item.physicalItem.id)
                            const artistName = backofficeUser.artist?.name || ''
                            const artistSurname = backofficeUser.artist?.surname || ''
                            const folderName = `${artistName} ${artistSurname}`
                                .normalize('NFD')
                                .replace(/[\u0300-\u036f]/g, '')
                                .replace(/[^a-zA-Z0-9\s]+/g, '')
                                .trim()

                            console.log(`📤 Début de l'upload des images par type pour physicalItemId: ${physicalItemId}`)

                            const { uploadImageToMarketplaceFolderByType } = await import('@/lib/firebase/storage')
                            const { savePhysicalItemImage, getPhysicalItemImagesByType } = await import('@/lib/actions/prisma-actions')
                            const { normalizeString } = await import('@/lib/utils')

                            const baseFileName = normalizeString(data.name || `artwork-${Date.now()}`)

                            // Uploader les images pour chaque type
                            for (const [imageType, files] of Object.entries(pendingImagesByType)) {
                                if (files && Array.isArray(files) && files.length > 0) {
                                    console.log(`📷 Upload de ${files.length} image(s) pour le type ${imageType}`)

                                    // Récupérer le nombre d'images existantes pour ce type
                                    const existingImagesResult = await getPhysicalItemImagesByType(physicalItemId)
                                    const imagesByType = existingImagesResult.imagesByType as Record<string, any[]> | undefined
                                    const existingCount = imagesByType?.[imageType]?.length || 0

                                    for (let index = 0; index < files.length; index++) {
                                        const file = files[index]

                                        // Vérifier que c'est bien un File
                                        if (!(file instanceof File)) {
                                            console.error(`❌ Le fichier à l'index ${index} pour le type ${imageType} n'est pas un File:`, file)
                                            continue
                                        }

                                        const fileName = `${baseFileName}-${imageType}-${index + 1}`

                                        try {
                                            console.log(`⬆️ Upload de l'image ${index + 1}/${files.length} pour ${imageType}...`)
                                            const imageUrl = await uploadImageToMarketplaceFolderByType(
                                                file,
                                                folderName,
                                                imageType,
                                                fileName,
                                                undefined,
                                                undefined
                                            )

                                            console.log(`✅ Image uploadée avec succès: ${imageUrl}`)

                                            // Sauvegarder dans PhysicalItemImage avec l'ordre correct
                                            const saveResult = await savePhysicalItemImage(
                                                physicalItemId,
                                                imageUrl,
                                                imageType,
                                                null,
                                                existingCount + index
                                            )

                                            if (saveResult.success) {
                                                console.log(`💾 Image sauvegardée dans PhysicalItemImage pour le type ${imageType}`)
                                            } else {
                                                console.error(`❌ Erreur lors de la sauvegarde: ${saveResult.error}`)
                                            }
                                        } catch (error) {
                                            console.error(`❌ Erreur lors de l'upload de l'image ${imageType} (index ${index}):`, error)
                                        }
                                    }
                                }
                            }
                        } else {
                            console.log('ℹ️ Aucun fichier en attente d\'upload ou physicalItemId manquant')
                        }

                        // Supprimer les images marquées pour suppression
                        const removedImagesByType = removedImagesByTypeRef.current
                        console.log('🗑️ Images à supprimer par type:', removedImagesByType)

                        if (removedImagesByType && Object.keys(removedImagesByType).length > 0 && result.item?.physicalItem?.id) {
                            const physicalItemId = BigInt(result.item.physicalItem.id)

                            console.log(`🗑️ Début de la suppression des images pour physicalItemId: ${physicalItemId}`)

                            const { deleteImageFromFirebase } = await import('@/lib/firebase/storage')
                            const { deletePhysicalItemImageByUrl } = await import('@/lib/actions/prisma-actions')

                            // Supprimer les images pour chaque type
                            for (const [imageType, imageUrls] of Object.entries(removedImagesByType)) {
                                if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
                                    console.log(`🗑️ Suppression de ${imageUrls.length} image(s) pour le type ${imageType}`)

                                    for (const imageUrl of imageUrls) {
                                        try {
                                            console.log(`🗑️ [onSubmit-EDIT] Suppression de l'image: ${imageUrl} (type: ${imageType})`)

                                            // Supprimer de Firebase Storage EN PREMIER
                                            console.log(`🔥 [onSubmit-EDIT] Étape 1: Suppression Firebase pour ${imageUrl}`)
                                            const firebaseDeleted = await deleteImageFromFirebase(imageUrl)
                                            if (!firebaseDeleted) {
                                                console.warn(`⚠️ [onSubmit-EDIT] Échec de la suppression Firebase pour: ${imageUrl}`)
                                                // On continue quand même pour supprimer de la DB
                                            } else {
                                                console.log(`✅ [onSubmit-EDIT] Image supprimée de Firebase: ${imageUrl}`)
                                            }

                                            // Supprimer de la base de données ENSUITE
                                            console.log(`💾 [onSubmit-EDIT] Étape 2: Suppression DB pour ${imageUrl}`)
                                            const dbResult = await deletePhysicalItemImageByUrl(
                                                physicalItemId,
                                                imageUrl,
                                                imageType
                                            )

                                            if (dbResult.success) {
                                                console.log(`✅ [onSubmit-EDIT] Image supprimée de la DB pour le type ${imageType}`)
                                            } else {
                                                console.error(`❌ [onSubmit-EDIT] Erreur lors de la suppression DB: ${dbResult.error}`)
                                            }
                                        } catch (error) {
                                            console.error(`❌ [onSubmit-EDIT] Erreur lors de la suppression de l'image ${imageUrl} (type ${imageType}):`, error)
                                            console.error(`❌ [onSubmit-EDIT] Détails de l'erreur:`, error instanceof Error ? error.message : String(error))
                                        }
                                    }
                                }
                            }
                        } else {
                            console.log('ℹ️ Aucune image à supprimer ou physicalItemId manquant')
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
                const validationResult = physicalArtworkSchema.safeParse(data)

                if (!validationResult.success) {
                    console.error('Erreurs de validation:', validationResult.error.errors)
                    // Les erreurs de validation sont maintenant affichées dans la modale
                    // Plus besoin de toast d'erreur ici
                    setIsSubmitting(false)
                    return
                }

                try {
                    // Upload des images vers Firebase Storage
                    // Vérifier si on a une nouvelle image (soit via Firebase, soit via input file)
                    const hasFirebaseImage = !!data.mainImageUrl && data.mainImageUrl !== initialData?.imageUrl
                    const isRealNewImage = hasFirebaseImage || (fileInputRef.current &&
                        fileInputRef.current.files &&
                        fileInputRef.current.files.length > 0)

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
                        physicalCollectionId: data.physicalCollectionId ? parseInt(data.physicalCollectionId, 10) : undefined,
                        // Caractéristiques artistiques (maintenant dans PhysicalItem)
                        mediumId: data.mediumId ? parseInt(data.mediumId, 10) : undefined,
                        supportId: data.supportId ? parseInt(data.supportId, 10) : undefined,
                        styleIds: data.styleIds ? data.styleIds.map(id => typeof id === 'string' ? parseInt(id, 10) : id) : undefined,
                        techniqueIds: data.techniqueIds ? data.techniqueIds.map(id => typeof id === 'string' ? parseInt(id, 10) : id) : undefined,
                        themeIds: data.themeIds ? data.themeIds.map(id => typeof id === 'string' ? parseInt(id, 10) : id) : undefined,
                    } : null

                    // Mettre à jour la modale de progression
                    progressCallbacks?.onProgressUpdate?.('upload', 'completed')
                    progressCallbacks?.onProgressUpdate?.('save', 'in-progress')

                    // Créer l'enregistrement de l'œuvre avec les types appropriés
                    const newItem = await createItemRecord(
                        backofficeUser.id,
                        'created',
                        tags,
                        itemBaseData,
                        physicalItemData
                    )

                    if (newItem && newItem.item && newItem.item.id) {
                        // Sauvegarder le certificat d'œuvre physique
                        if (data.hasPhysicalOnly && data.physicalCertificate && data.physicalCertificate instanceof FileList && data.physicalCertificate.length > 0) {
                            const certificateFile = data.physicalCertificate[0]
                            const arrayBuffer = await certificateFile.arrayBuffer()
                            const buffer = new Uint8Array(arrayBuffer)
                            await savePhysicalCertificate(newItem.item.id, buffer)
                        }

                        if (mainImageUrl || allSecondaryImageUrls.length > 0) {
                            const { saveItemImages } = await import('@/lib/actions/prisma-actions')
                            await saveItemImages(newItem.item.id, mainImageUrl, allSecondaryImageUrls)
                        }

                        // Uploader les images par type si des fichiers sont en attente
                        // Récupérer depuis la ref car les File ne sont pas sérialisables dans le formulaire
                        const pendingImagesByType = pendingImagesByTypeRef.current
                        console.log('📸 Fichiers en attente d\'upload par type (création):', pendingImagesByType)

                        if (pendingImagesByType && Object.keys(pendingImagesByType).length > 0 && newItem.item.physicalItem?.id) {
                            const physicalItemId = BigInt(newItem.item.physicalItem.id)
                            const artistName = backofficeUser.artist?.name || ''
                            const artistSurname = backofficeUser.artist?.surname || ''
                            const folderName = `${artistName} ${artistSurname}`
                                .normalize('NFD')
                                .replace(/[\u0300-\u036f]/g, '')
                                .replace(/[^a-zA-Z0-9\s]+/g, '')
                                .trim()

                            console.log(`📤 Début de l'upload des images par type pour physicalItemId: ${physicalItemId}`)

                            const { uploadImageToMarketplaceFolderByType } = await import('@/lib/firebase/storage')
                            const { savePhysicalItemImage } = await import('@/lib/actions/prisma-actions')
                            const { normalizeString } = await import('@/lib/utils')

                            const baseFileName = normalizeString(data.name || `artwork-${Date.now()}`)

                            // Uploader les images pour chaque type
                            for (const [imageType, files] of Object.entries(pendingImagesByType)) {
                                if (files && Array.isArray(files) && files.length > 0) {
                                    console.log(`📷 Upload de ${files.length} image(s) pour le type ${imageType}`)

                                    for (let index = 0; index < files.length; index++) {
                                        const file = files[index]

                                        // Vérifier que c'est bien un File
                                        if (!(file instanceof File)) {
                                            console.error(`❌ Le fichier à l'index ${index} pour le type ${imageType} n'est pas un File:`, file)
                                            continue
                                        }

                                        const fileName = `${baseFileName}-${imageType}-${index + 1}`

                                        try {
                                            console.log(`⬆️ Upload de l'image ${index + 1}/${files.length} pour ${imageType}...`)
                                            const imageUrl = await uploadImageToMarketplaceFolderByType(
                                                file,
                                                folderName,
                                                imageType,
                                                fileName,
                                                undefined,
                                                undefined
                                            )

                                            console.log(`✅ Image uploadée avec succès: ${imageUrl}`)

                                            // Sauvegarder dans PhysicalItemImage
                                            const saveResult = await savePhysicalItemImage(
                                                physicalItemId,
                                                imageUrl,
                                                imageType,
                                                null,
                                                index
                                            )

                                            if (saveResult.success) {
                                                console.log(`💾 Image sauvegardée dans PhysicalItemImage pour le type ${imageType}`)
                                            } else {
                                                console.error(`❌ Erreur lors de la sauvegarde: ${saveResult.error}`)
                                            }
                                        } catch (error) {
                                            console.error(`❌ Erreur lors de l'upload de l'image ${imageType} (index ${index}):`, error)
                                        }
                                    }
                                }
                            }
                        } else {
                            console.log('ℹ️ Aucun fichier en attente d\'upload ou physicalItemId manquant')
                        }

                        // Supprimer les images marquées pour suppression (mode création)
                        const removedImagesByType = removedImagesByTypeRef.current
                        console.log('🗑️ Images à supprimer par type (création):', removedImagesByType)

                        if (removedImagesByType && Object.keys(removedImagesByType).length > 0 && newItem.item.physicalItem?.id) {
                            const physicalItemId = BigInt(newItem.item.physicalItem.id)

                            console.log(`🗑️ Début de la suppression des images pour physicalItemId: ${physicalItemId}`)

                            const { deleteImageFromFirebase } = await import('@/lib/firebase/storage')
                            const { deletePhysicalItemImageByUrl } = await import('@/lib/actions/prisma-actions')

                            // Supprimer les images pour chaque type
                            for (const [imageType, imageUrls] of Object.entries(removedImagesByType)) {
                                if (imageUrls && Array.isArray(imageUrls) && imageUrls.length > 0) {
                                    console.log(`🗑️ Suppression de ${imageUrls.length} image(s) pour le type ${imageType}`)

                                    for (const imageUrl of imageUrls) {
                                        try {
                                            console.log(`🗑️ [onSubmit-CREATE] Suppression de l'image: ${imageUrl} (type: ${imageType})`)

                                            // Supprimer de Firebase Storage EN PREMIER
                                            console.log(`🔥 [onSubmit-CREATE] Étape 1: Suppression Firebase pour ${imageUrl}`)
                                            const firebaseDeleted = await deleteImageFromFirebase(imageUrl)
                                            if (!firebaseDeleted) {
                                                console.warn(`⚠️ [onSubmit-CREATE] Échec de la suppression Firebase pour: ${imageUrl}`)
                                                // On continue quand même pour supprimer de la DB
                                            } else {
                                                console.log(`✅ [onSubmit-CREATE] Image supprimée de Firebase: ${imageUrl}`)
                                            }

                                            // Supprimer de la base de données ENSUITE
                                            console.log(`💾 [onSubmit-CREATE] Étape 2: Suppression DB pour ${imageUrl}`)
                                            const dbResult = await deletePhysicalItemImageByUrl(
                                                physicalItemId,
                                                imageUrl,
                                                imageType
                                            )

                                            if (dbResult.success) {
                                                console.log(`✅ [onSubmit-CREATE] Image supprimée de la DB pour le type ${imageType}`)
                                            } else {
                                                console.error(`❌ [onSubmit-CREATE] Erreur lors de la suppression DB: ${dbResult.error}`)
                                            }
                                        } catch (error) {
                                            console.error(`❌ [onSubmit-CREATE] Erreur lors de la suppression de l'image ${imageUrl} (type ${imageType}):`, error)
                                            console.error(`❌ [onSubmit-CREATE] Détails de l'erreur:`, error instanceof Error ? error.message : String(error))
                                        }
                                    }
                                }
                            }
                        } else {
                            console.log('ℹ️ Aucune image à supprimer ou physicalItemId manquant')
                        }
                    }

                    // Mettre à jour la modale de progression
                    progressCallbacks?.onProgressUpdate?.('save', 'completed')

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
        pendingImagesByTypeRef,
        removedImagesByTypeRef,
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