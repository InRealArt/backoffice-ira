'use client'

import { useState, useRef, useEffect, useCallback, RefObject } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { artworkSchema, artworkEditSchema, ArtworkFormData } from '../../createArtwork/schema'
import toast from 'react-hot-toast'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { getBackofficeUserByEmail, createItemRecord, updateItemRecord, saveAuthCertificate } from '@/lib/actions/prisma-actions'
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
    const [numPages, setNumPages] = useState<number | null>(null)
    const [tags, setTags] = useState<string[]>([])
    const [hasIntellectualProperty, setHasIntellectualProperty] = useState(initialData?.intellectualProperty || false)
    const [slug, setSlug] = useState(initialData?.slug || '')
    const fileInputRef = useRef<HTMLInputElement>(null)
    const certificateInputRef = useRef<HTMLInputElement>(null)
    const secondaryImagesInputRef = useRef<HTMLInputElement>(null)
    const [secondaryImages, setSecondaryImages] = useState<string[]>([])
    const [secondaryImagesFiles, setSecondaryImagesFiles] = useState<File[]>([])
    const { user } = useDynamicContext()
    const [formErrors, setFormErrors] = useState<any>(null)
    const isEditMode = mode === 'edit'
    const router = useRouter()
    const [hasExistingMainImage, setHasExistingMainImage] = useState(false)

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
        resolver: zodResolver(validationSchema),
        defaultValues: {
            title: initialData?.title || '',
            description: initialData?.description || '',
            metaTitle: initialData?.metaTitle || '',
            metaDescription: initialData?.metaDescription || '',
            medium: initialData?.medium || '',
            width: initialData?.width || '',
            height: initialData?.height || '',
            weight: initialData?.weight || '',
            creationYear: initialData?.creationYear || new Date().getFullYear().toString(),
            intellectualProperty: initialData?.intellectualProperty || false,
            intellectualPropertyEndDate: initialData?.intellectualPropertyEndDate || '',
            images: undefined,
            certificate: undefined,
            hasPhysicalOnly: initialData?.hasPhysicalOnly || false,
            hasNftOnly: initialData?.hasNftOnly || false,
            hasNftPlusPhysical: initialData?.hasNftPlusPhysical || false,
            pricePhysicalBeforeTax: initialData?.pricePhysicalBeforeTax || '',
            priceNftBeforeTax: initialData?.priceNftBeforeTax || '',
            priceNftPlusPhysicalBeforeTax: initialData?.priceNftPlusPhysicalBeforeTax || '',
            certificateUrl: initialData?.certificateUrl || '',
        }
    })

    // Watch form values
    const intellectualProperty = watch('intellectualProperty')
    const hasPhysicalOnly = watch('hasPhysicalOnly')
    const hasNftPlusPhysical = watch('hasNftPlusPhysical')
    const hasNftOnly = watch('hasNftOnly')
    const title = watch('title')

    // Callback for pricing option changes
    useEffect(() => {
        if (onPricingOptionsChange) {
            if (typeof onPricingOptionsChange === 'object') {
                if (onPricingOptionsChange.setHasPhysicalOnly) {
                    onPricingOptionsChange.setHasPhysicalOnly(hasPhysicalOnly as boolean)
                }
                if (onPricingOptionsChange.setHasNftOnly) {
                    onPricingOptionsChange.setHasNftOnly(hasNftOnly as boolean)
                }
                if (onPricingOptionsChange.setHasNftPlusPhysical) {
                    onPricingOptionsChange.setHasNftPlusPhysical(hasNftPlusPhysical as boolean)
                }
            }
        }
    }, [hasPhysicalOnly, hasNftOnly, hasNftPlusPhysical, onPricingOptionsChange])

    // Callback for title changes
    useEffect(() => {
        if (onTitleChange && title) {
            onTitleChange(title)
        }
    }, [title, onTitleChange])

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
        if (title) {
            setSlug(normalizeString(title))
        }
    }, [title])

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
    }, [isEditMode, initialData, setValue])

    // Disable image validation if existing image in edit mode
    useEffect(() => {
        if (isEditMode && initialData?.imageUrl && previewImages.length > 0) {
            setValue('images', null as any, { shouldValidate: false })
            setHasExistingMainImage(true)
        }

        if (isEditMode && initialData?.certificateUrl) {
            setValue('certificate', null as any, { shouldValidate: false })
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
                title: 'Titre',
                description: 'Description',
                pricePhysicalBeforeTax: 'Prix - Oeuvre physique',
                priceNftBeforeTax: 'Prix - NFT',
                priceNftPlusPhysicalBeforeTax: 'Prix - NFT + Oeuvre physique',
                pricingOption: 'Option de tarification',
                medium: 'Support/Medium',
                images: 'Image Principale',
                certificate: 'Certificat d\'authenticité',
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
                errors.priceNftBeforeTax?.message ||
                errors.priceNftPlusPhysicalBeforeTax?.message

            if (hasPricingOptionError && errors.root?.message) {
                toast.error(String(errors.root.message), {
                    ...toastErrorOptions,
                    id: 'pricing-option-error'
                })
            } else if (hasPriceError) {
                if (errors.pricePhysicalBeforeTax?.message) {
                    toast.error(String(errors.pricePhysicalBeforeTax.message), {
                        ...toastErrorOptions,
                        id: 'price-physical-error'
                    })
                } else if (errors.priceNftBeforeTax?.message) {
                    toast.error(String(errors.priceNftBeforeTax.message), {
                        ...toastErrorOptions,
                        id: 'price-nft-error'
                    })
                } else if (errors.priceNftPlusPhysicalBeforeTax?.message) {
                    toast.error(String(errors.priceNftPlusPhysicalBeforeTax.message), {
                        ...toastErrorOptions,
                        id: 'price-nft-physical-error'
                    })
                }
            } else if (hasPhysicalDimensionsError && errors.root?.message) {
                toast.error(String(errors.root.message), {
                    ...toastErrorOptions,
                    id: 'physical-dimensions-error'
                })
            } else {
                const missingFields = Object.keys(errors)
                    .filter(key => key !== 'images' || !shouldIgnoreImageError)
                    .map(key => fieldNames[key])
                    .filter(Boolean)

                if (missingFields.length > 0) {
                    toast.error(`Champs obligatoires manquants : ${missingFields.join(', ')}`, {
                        ...toastErrorOptions,
                        id: 'missing-fields-error'
                    })
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
    }, [errors, isEditMode, initialData?.imageUrl, previewImages.length, toastErrorOptions])

    // Handle main image change
    const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return

        const imageFiles = Array.from(files)
        const imageUrls: string[] = []

        imageFiles.forEach(file => {
            const url = URL.createObjectURL(file)
            imageUrls.push(url)
        })

        setPreviewImages(imageUrls)
    }, [])

    // Handle secondary images change
    const handleSecondaryImagesChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files) return

        const newImageFiles = Array.from(files)
        const newImageUrls: string[] = []

        newImageFiles.forEach(file => {
            const url = URL.createObjectURL(file)
            newImageUrls.push(url)
        })

        setSecondaryImages(prev => [...prev, ...newImageUrls])
        setSecondaryImagesFiles(prev => [...prev, ...newImageFiles])
    }, [])

    // Handle certificate change
    const handleCertificateChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files
        if (!files || files.length === 0) {
            setPreviewCertificate(null)
            setValue('certificate', null as any, { shouldValidate: true })
            return
        }

        const file = files[0]
        if (file.type !== 'application/pdf') {
            toast.error('Seuls les fichiers PDF sont acceptés pour le certificat d\'authenticité')
            if (certificateInputRef.current) {
                certificateInputRef.current.value = ''
            }
            setPreviewCertificate(null)
            setValue('certificate', null as any, { shouldValidate: true })
            return
        }

        const url = URL.createObjectURL(file)
        setPreviewCertificate(url)

        setValue('certificate', e.target.files as unknown as FileList, { shouldValidate: true })
    }, [setValue])

    // Remove secondary image
    const removeSecondaryImage = useCallback(async (index: number) => {
        try {
            if (isEditMode && initialData?.id) {
                const imageUrl = secondaryImages[index]

                if (isExistingImage(imageUrl)) {
                    setIsSubmitting(true)

                    const loadingToast = toast.loading('Suppression de l\'image en cours...')

                    try {
                        const { deleteImageFromFirebase } = await import('@/lib/firebase/storage')
                        const storageDeleted = await deleteImageFromFirebase(imageUrl)

                        if (!storageDeleted) {
                            console.error('Erreur lors de la suppression de l\'image dans Firebase Storage')
                        }

                        const { removeSecondaryImage: deleteImageFromDb } = await import('@/lib/actions/prisma-actions')
                        await deleteImageFromDb(initialData.id, imageUrl)

                        toast.dismiss(loadingToast)
                        toast.success('Image supprimée avec succès')

                        setSecondaryImages(prev => prev.filter((_, i) => i !== index))
                        setSecondaryImagesFiles(prev => prev.filter((_, i) => i !== index))
                    } catch (error) {
                        toast.dismiss(loadingToast)
                        console.error('Erreur lors de la suppression de l\'image:', error)
                        toast.error('Erreur lors de la suppression de l\'image')
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
            toast.error('Erreur lors de la suppression de l\'image')
        }
    }, [isEditMode, initialData, secondaryImages, isExistingImage])

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

                const itemSlug = slug || normalizeString(data.title)

                const { getAuth, signInAnonymously } = await import('firebase/auth')
                const { app } = await import('@/lib/firebase/config')
                const { uploadImageToFirebase, uploadMultipleImagesToFirebase, deleteImageFromFirebase } = await import('@/lib/firebase/storage')

                const auth = getAuth(app)
                const userCredential = await signInAnonymously(auth)

                if (isRealNewImage && fileInputRef.current && fileInputRef.current.files && fileInputRef.current.files.length > 0) {
                    if (initialData?.imageUrl) {
                        toast.loading('Remplacement de l\'image principale en cours...', { id: 'replace-image' })

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

                    toast.success('Nouvelle image uploadée avec succès', { id: 'replace-image' })
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
                toast.error('Erreur lors de l\'upload des images')
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

            if (isEditMode && initialData?.id) {
                try {
                    setIsSubmitting(true)

                    const loadingToast = toast.loading('Mise à jour de l\'œuvre en cours...')

                    const isRealNewImage = fileInputRef.current &&
                        fileInputRef.current.files &&
                        fileInputRef.current.files.length > 0

                    const { mainImageUrl } = await handleUpload(data, backofficeUser, isRealNewImage as boolean)

                    const updateData: any = {
                        name: data.title,
                        height: data.height ? parseFloat(data.height) : undefined,
                        width: data.width ? parseFloat(data.width) : undefined,
                        weight: data.weight ? parseFloat(data.weight) : undefined,
                        intellectualProperty: data.intellectualProperty,
                        intellectualPropertyEndDate: data.intellectualPropertyEndDate ? new Date(data.intellectualPropertyEndDate) : null,
                        creationYear: data.creationYear ? parseInt(data.creationYear, 10) : null,
                        pricePhysicalBeforeTax: data.hasPhysicalOnly && data.pricePhysicalBeforeTax ? parseInt(data.pricePhysicalBeforeTax, 10) : 0,
                        priceNftBeforeTax: data.hasNftOnly && data.priceNftBeforeTax ? parseInt(data.priceNftBeforeTax, 10) : 0,
                        priceNftPlusPhysicalBeforeTax: data.hasNftPlusPhysical && data.priceNftPlusPhysicalBeforeTax ? parseInt(data.priceNftPlusPhysicalBeforeTax, 10) : 0,
                        artworkSupport: data.medium || null,
                        metaTitle: data.metaTitle,
                        metaDescription: data.metaDescription,
                        description: data.description || '',
                        slug: slug || normalizeString(data.title),
                        tags: tags,
                    }

                    if (isRealNewImage && mainImageUrl && mainImageUrl !== initialData.imageUrl) {
                        updateData.mainImageUrl = mainImageUrl
                    }

                    const result = await updateItemRecord(
                        initialData.id,
                        updateData
                    )

                    if (result.success) {
                        if (data.certificate && data.certificate instanceof FileList && data.certificate.length > 0) {
                            const certificateFile = data.certificate[0]
                            const arrayBuffer = await certificateFile.arrayBuffer()
                            const buffer = new Uint8Array(arrayBuffer)
                            await saveAuthCertificate(initialData.id, buffer)
                        }

                        toast.dismiss(loadingToast)
                        toast.success(`L'œuvre "${data.title}" a été mise à jour avec succès!`)

                        if (onSuccess) {
                            onSuccess()
                        }
                    } else {
                        toast.dismiss(loadingToast)
                        toast.error(`Erreur lors de la mise à jour: ${result.message || 'Une erreur est survenue'}`)
                    }
                } catch (error: any) {
                    console.error('Erreur lors de la mise à jour de l\'œuvre:', error)
                    toast.error(error.message || 'Une erreur est survenue lors de la mise à jour')
                }
            } else {
                try {
                    // Upload des images vers Firebase Storage
                    const isRealNewImage = fileInputRef.current &&
                        fileInputRef.current.files &&
                        fileInputRef.current.files.length > 0

                    const { mainImageUrl, allSecondaryImageUrls } = await handleUpload(data, backofficeUser, isRealNewImage as boolean)

                    // Créer l'enregistrement de l'œuvre
                    const newItem = await createItemRecord(
                        backofficeUser.id,
                        'created',
                        tags,
                        {
                            name: data.title,
                            height: data.height ? parseFloat(data.height) : undefined,
                            width: data.width ? parseFloat(data.width) : undefined,
                            weight: data.weight ? parseFloat(data.weight) : undefined,
                            intellectualProperty: data.intellectualProperty,
                            intellectualPropertyEndDate: data.intellectualPropertyEndDate ? new Date(data.intellectualPropertyEndDate) : null,
                            creationYear: data.creationYear ? parseInt(data.creationYear, 10) : null,
                            pricePhysicalBeforeTax: data.hasPhysicalOnly && data.pricePhysicalBeforeTax ? parseInt(data.pricePhysicalBeforeTax, 10) : 0,
                            priceNftBeforeTax: data.hasNftOnly && data.priceNftBeforeTax ? parseInt(data.priceNftBeforeTax, 10) : 0,
                            priceNftPlusPhysicalBeforeTax: data.hasNftPlusPhysical && data.priceNftPlusPhysicalBeforeTax ? parseInt(data.priceNftPlusPhysicalBeforeTax, 10) : 0,
                            artworkSupport: data.medium || null,
                            metaTitle: data.metaTitle,
                            metaDescription: data.metaDescription,
                            description: data.description || '',
                            slug: slug || normalizeString(data.title),
                            mainImageUrl: mainImageUrl || null
                        }
                    )

                    if (newItem && newItem.item && newItem.item.id) {
                        if (data.certificate && data.certificate instanceof FileList && data.certificate.length > 0) {
                            const certificateFile = data.certificate[0]
                            const arrayBuffer = await certificateFile.arrayBuffer()
                            const buffer = new Uint8Array(arrayBuffer)
                            await saveAuthCertificate(newItem.item.id, buffer)
                        }

                        if (mainImageUrl || allSecondaryImageUrls.length > 0) {
                            const { saveItemImages } = await import('@/lib/actions/prisma-actions')
                            await saveItemImages(newItem.item.id, mainImageUrl, allSecondaryImageUrls)
                        }
                    }

                    toast.success(`L'œuvre "${data.title}" a été créée avec succès!`)

                    if (onSuccess) {
                        onSuccess()
                    } else {
                        handleResetForm()
                    }
                } catch (error: any) {
                    console.error('Erreur lors de la création de l\'œuvre:', error)
                    toast.error(error.message || 'Une erreur est survenue lors de la création')
                }
            }
        } catch (error: any) {
            console.error('Erreur lors de la soumission du formulaire:', error)
            toast.error(error.message || 'Une erreur est survenue')
        } finally {
            setIsSubmitting(false)
        }
    }

    return {
        isSubmitting,
        previewImages,
        previewCertificate,
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
        secondaryImagesInputRef: secondaryImagesInputRef as RefObject<HTMLInputElement>,
        handleImageChange,
        handleSecondaryImagesChange,
        removeSecondaryImage,
        handleCertificateChange,
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