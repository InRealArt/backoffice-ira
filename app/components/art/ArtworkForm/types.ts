// Types pour les formulaires et composants d'artwork
import { PhysicalArtworkFormData } from '../schema'
import { Control, FieldErrors, UseFormRegister, UseFormSetValue, UseFormGetValues } from 'react-hook-form'
import { ArtworkMedium, ArtworkStyle, ArtworkTechnique, ArtworkTheme, ArtworkSupport } from '@prisma/client'

// Alias pour maintenir la compatibilité avec le code existant
export type ArtworkFormData = PhysicalArtworkFormData

export interface Address {
    id: number
    name: string
    firstName: string
    lastName: string
    streetAddress: string
    postalCode: string
    city: string
    country: string
}

export interface PhysicalCollection {
    id: number
    name: string
    description: string
    landingArtistId: number
}

export interface ProgressCallbacks {
    onProgressUpdate?: (stepId: string, status: 'pending' | 'in-progress' | 'completed' | 'error', error?: string) => void
}

export interface ArtworkFormProps {
    mode: 'create' | 'edit'
    addresses?: Address[]
    mediums?: ArtworkMedium[]
    styles?: ArtworkStyle[]
    techniques?: ArtworkTechnique[]
    themes?: ArtworkTheme[]
    supports?: ArtworkSupport[]
    collections?: PhysicalCollection[]
    artistName?: string
    artistSurname?: string
    isPhysicalOnly?: boolean
    readOnlyCollectionId?: number
    initialData?: {
        id?: number
        title?: string
        description?: string
        price?: number
        metaTitle?: string
        metaDescription?: string
        medium?: string
        width?: string
        height?: string
        weight?: string
        year?: string
        creationYear?: string
        intellectualProperty?: boolean
        intellectualPropertyEndDate?: string
        imageUrl?: string
        hasPhysicalOnly?: boolean
        hasNftOnly?: boolean
        hasNftPlusPhysical?: boolean
        pricePhysicalBeforeTax?: string
        priceNftBeforeTax?: string
        priceNftPlusPhysicalBeforeTax?: string
        slug?: string
        certificateUrl?: string
        physicalCertificateUrl?: string
        nftCertificateUrl?: string
        secondaryImagesUrl?: string[]
        initialQty?: number
        shippingAddressId?: number
        mediumId?: number
        styleIds?: number[]
        techniqueIds?: number[]
        themeIds?: number[]
        supportId?: number
        // Nouvelles propriétés pour les entités liées
        physicalItem?: {
            id?: number
            price?: number
            initialQty?: number
            stockQty?: number
            height?: number | string
            width?: number | string
            weight?: number | string
            creationYear?: number | string
            status?: string
            commercialStatus?: 'AVAILABLE' | 'UNAVAILABLE'
            shippingAddressId?: number
            physicalCollectionId?: number
            mediumId?: number
            supportId?: number
            itemStyles?: Array<{ styleId: number; style: { name: string } }>
            itemTechniques?: Array<{ techniqueId: number; technique: { name: string } }>
            itemThemes?: Array<{ themeId: number; theme: { name: string } }>
        } | null
        nftItem?: {
            id?: number
            price?: number
            status?: string
        } | null
        imagesByType?: Record<string, string[]>
    }
    onSuccess?: () => void
    onTitleChange?: (title: string) => void
    onPricingOptionsChange?: {
        setHasPhysicalOnly?: (value: boolean) => void
        setHasNftOnly?: (value: boolean) => void
        setHasNftPlusPhysical?: (value: boolean) => void
    } | ((value: string) => void)
    progressCallbacks?: ProgressCallbacks
}

export interface InfoTooltipProps {
    title: string
    content: React.ReactNode
}

export interface FormSectionProps {
    title: string
    children: React.ReactNode
    bgVariant?: 'default' | 'subtle-1' | 'subtle-2' | 'subtle-3' | 'subtle-4' | 'subtle-5'
}

export interface TagInputProps {
    value: string[]
    onChange: (tags: string[]) => void
    placeholder?: string
    maxTags?: number
    className?: string
}

export interface ImagePreviewProps {
    images: string[]
    label?: string
    onRemove?: (index: number) => void
    isExistingImage?: (src: string) => boolean
}

export interface PdfPreviewProps {
    url: string | null
    certificateFile?: File | null
}

export interface PricingOptionProps {
    id: 'hasPhysicalOnly' | 'hasNftOnly' | 'hasNftPlusPhysical'
    label: string
    register: any
    priceFieldId: string
    priceFieldRegister: any
    errors: any
    isChecked: boolean
}

export type FormFields = {
    register: UseFormRegister<any>
    control: Control<any>
    errors: FieldErrors
    setValue: UseFormSetValue<any>
    getValues: UseFormGetValues<any>
    isDirty?: boolean
    isSubmitted?: boolean
    onTitleChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
    onPricingOptionsChange?: (value: string) => void
    slug?: string
    title?: string
    isFormReadOnly?: boolean
    mediums?: ArtworkMedium[]
    styles?: ArtworkStyle[]
    techniques?: ArtworkTechnique[]
    themes?: ArtworkTheme[]
}

export type UseArtworkFormReturn = {
    isSubmitting: boolean
    previewImages: string[]
    previewCertificate: string | null
    previewPhysicalCertificate: string | null
    previewNftCertificate: string | null
    numPages: number | null
    tags: string[]
    setTags: (tags: string[]) => void
    hasIntellectualProperty: boolean
    slug: string
    secondaryImages: string[]
    secondaryImagesFiles: File[]
    formErrors: any
    isEditMode: boolean
    hasExistingMainImage: boolean
    fileInputRef: React.RefObject<HTMLInputElement>
    certificateInputRef: React.RefObject<HTMLInputElement>
    physicalCertificateInputRef: React.RefObject<HTMLInputElement>
    nftCertificateInputRef: React.RefObject<HTMLInputElement>
    secondaryImagesInputRef: React.RefObject<HTMLInputElement>
    pendingImagesByTypeRef: React.MutableRefObject<Record<string, File[]>>
    removedImagesByTypeRef: React.MutableRefObject<Record<string, string[]>>
    handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    handleSecondaryImagesChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    removeSecondaryImage: (index: number) => Promise<void>
    handleCertificateChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    handlePhysicalCertificateChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    handleNftCertificateChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    onDocumentLoadSuccess: ({ numPages }: { numPages: number }) => void
    handleResetForm: () => void
    onSubmit: (data: ArtworkFormData) => Promise<void>
    isExistingImage: (src: string) => boolean
    handleSubmit: any
    formState: any
    toastErrorOptions: any
    register: any
    setValue: any
    control: Control<any>
    getValues: UseFormGetValues<any>
}

export interface PricingSectionProps extends FormFields {
    hasPhysicalOnly: boolean
    hasNftOnly: boolean
    hasNftPlusPhysical: boolean
    onPricingOptionChange: (option: 'hasPhysicalOnly' | 'hasNftOnly' | 'hasNftPlusPhysical', checked: boolean) => void
    isEditMode?: boolean
    physicalItemStatus?: string
    nftItemStatus?: string
    isFormReadOnly?: boolean
    isPhysicalOnly?: boolean
}

export interface TagsSectionProps extends FormFields {
    tags: string[]
    setTags: (tags: string[]) => void
}

export interface MediaFilesSectionProps extends FormFields {
    isEditMode: boolean
    initialImageUrl?: string
    fileInputRef: React.RefObject<HTMLInputElement>
    secondaryImagesInputRef: React.RefObject<HTMLInputElement>
    handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    handleSecondaryImagesChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    isFormReadOnly?: boolean
    artistName?: string
    artistSurname?: string
    artworkName?: string
    onMainImageUploaded?: (imageUrl: string) => void
    physicalItemId?: number | bigint
    initialImagesByType?: Record<string, string[]>
    pendingImagesByTypeRef?: React.MutableRefObject<Record<string, File[]>>
    removedImagesByTypeRef?: React.MutableRefObject<Record<string, string[]>>
}

export interface PhysicalCertificateSectionProps extends FormFields {
    isEditMode: boolean
    certificateUrl?: string
    fileInputRef: React.RefObject<HTMLInputElement>
    handleCertificateChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    isFormReadOnly?: boolean
}

export interface NftCertificateSectionProps extends FormFields {
    isEditMode: boolean
    certificateUrl?: string
    fileInputRef: React.RefObject<HTMLInputElement>
    handleCertificateChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    isFormReadOnly?: boolean
} 