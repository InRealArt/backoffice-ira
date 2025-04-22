// Types pour les formulaires et composants d'artwork
import { ArtworkFormData } from '../../createArtwork/schema'
import { Control, FieldErrors, UseFormRegister, UseFormSetValue, UseFormGetValues } from 'react-hook-form'


export interface ArtworkFormProps {
    mode: 'create' | 'edit'
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
        secondaryImagesUrl?: string[]
    }
    onSuccess?: () => void
    onTitleChange?: (title: string) => void
    onPricingOptionsChange?: {
        setHasPhysicalOnly?: (value: boolean) => void
        setHasNftOnly?: (value: boolean) => void
        setHasNftPlusPhysical?: (value: boolean) => void
    } | ((value: string) => void)
}

export interface InfoTooltipProps {
    title: string
    content: React.ReactNode
}

export interface FormSectionProps {
    title: string
    children: React.ReactNode
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
}

export type UseArtworkFormReturn = {
    isSubmitting: boolean
    previewImages: string[]
    previewCertificate: string | null
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
    secondaryImagesInputRef: React.RefObject<HTMLInputElement>
    handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    handleSecondaryImagesChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    removeSecondaryImage: (index: number) => Promise<void>
    handleCertificateChange: (e: React.ChangeEvent<HTMLInputElement>) => void
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
}

export interface TagsSectionProps extends FormFields {
    tags: string[]
    setTags: (tags: string[]) => void
}

export interface MediaFilesSectionProps extends FormFields {
    isEditMode: boolean
    initialImageUrl?: string
    certificateUrl?: string
    fileInputRef: React.RefObject<HTMLInputElement>
    certificateInputRef: React.RefObject<HTMLInputElement>
    secondaryImagesInputRef: React.RefObject<HTMLInputElement>
    handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    handleSecondaryImagesChange: (e: React.ChangeEvent<HTMLInputElement>) => void
    handleCertificateChange: (e: React.ChangeEvent<HTMLInputElement>) => void
} 