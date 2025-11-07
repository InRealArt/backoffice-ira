'use client'

import { useState, useEffect, useMemo } from 'react'
import { useArtworkForm } from './useArtworkForm'
import { ArtworkFormProps } from './types'
import ImagePreview from './ImagePreview'
import PdfPreview from './PdfPreview'
// styles replaced by Tailwind utilities
import { normalizeString } from '@/lib/utils'
import {
  MainInfoSection,
  SeoSection,
  PricingSection,
  PhysicalPropertiesSection,
  NftPropertiesSection,
  ArtworkCharacteristicsSection,
  MediaFilesSection,
  TagsSection,
  ShippingAddressSection,
  FormActions,
  PhysicalCertificateSection,
  NftCertificateSection
} from './sections'
import { useRouter } from 'next/navigation'
import { deletePhysicalItem } from '@/lib/actions/prisma-actions'
import { useToast } from '@/app/components/Toast/ToastContext'
import Button from '@/app/components/Button/Button'

export default function ArtworkForm({ mode = 'create', addresses = [], mediums = [], styles: artStyles = [], techniques = [], initialData = {}, onSuccess, isPhysicalOnly = false }: ArtworkFormProps) {
  // État local pour le slug et le titre/nom
  const [localTitle, setLocalTitle] = useState(initialData?.title || '')
  const [localSlug, setLocalSlug] = useState(initialData?.slug || '')
  
  // État local pour les options de tarification
  // Si isPhysicalOnly est true, on force hasPhysicalOnly à true
  const [hasPhysicalOnly, setHasPhysicalOnly] = useState(isPhysicalOnly || initialData?.hasPhysicalOnly || false)
  const [hasNftOnly, setHasNftOnly] = useState(isPhysicalOnly ? false : (initialData?.hasNftOnly || false))
  const [hasNftPlusPhysical, setHasNftPlusPhysical] = useState(initialData?.hasNftPlusPhysical || false)
  
  // États pour la détection des entités liées à l'Item
  const [hasPhysicalItem, setHasPhysicalItem] = useState<boolean>(!!initialData?.physicalItem)
  const [hasNftItem, setHasNftItem] = useState<boolean>(!!initialData?.nftItem)
  const [hasCertificate, setHasCertificate] = useState<boolean>(!!initialData?.certificateUrl)
  
  // États pour suivre les changements des options de tarification
  const [initialPhysicalOnly, setInitialPhysicalOnly] = useState<boolean>(!!initialData?.physicalItem)
  const [initialNftOnly, setInitialNftOnly] = useState<boolean>(!!initialData?.nftItem)
  
  // État pour le mode lecture seule
  const [isFormReadOnly, setIsFormReadOnly] = useState<boolean>(false)
  
  // Récupérer les statuts des items
  const physicalItemStatus = initialData?.physicalItem?.status
  const nftItemStatus = initialData?.nftItem?.status
  
  // Vérifier si un des items est au statut "listed"
  useEffect(() => {
    if (mode === 'edit') {
      const isPhysicalListed = physicalItemStatus === 'listed'
      const isNftListed = nftItemStatus === 'listed'
      
      setIsFormReadOnly(isPhysicalListed || isNftListed)
    }
  }, [mode, physicalItemStatus, nftItemStatus])
  
  const {
    isSubmitting,
    previewImages,
    previewCertificate,
    previewPhysicalCertificate,
    previewNftCertificate,
    tags,
    setTags,
    secondaryImages,
    isEditMode,
    fileInputRef,
    certificateInputRef,
    physicalCertificateInputRef,
    nftCertificateInputRef,
    secondaryImagesInputRef,
    handleImageChange,
    handleSecondaryImagesChange,
    removeSecondaryImage,
    handleCertificateChange,
    handlePhysicalCertificateChange,
    handleNftCertificateChange,
    onSubmit: originalOnSubmit,
    isExistingImage,
    handleSubmit,
    formState: { errors },
    register,
    setValue,
    control,
    getValues
  } = useArtworkForm({ 
    mode, 
    initialData, 
    onSuccess,
    isPhysicalOnly,
    onTitleChange: (name) => {
      setLocalTitle(name)
      setLocalSlug(normalizeString(name))
    },
    onPricingOptionsChange: {
      setHasPhysicalOnly,
      setHasNftOnly,
      setHasNftPlusPhysical
    }
  })
  
  const certificateFile = certificateInputRef.current?.files?.[0] || null
  
  const router = useRouter()
  const { error: errorToast } = useToast()
  // Surveiller les changements de titre depuis le formulaire
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isFormReadOnly) {
      const newName = e.target.value
      setLocalTitle(newName)
      setLocalSlug(normalizeString(newName))
    }
  }
  
  // Forcer hasPhysicalOnly à true si isPhysicalOnly est true
  useEffect(() => {
    if (isPhysicalOnly) {
      setHasPhysicalOnly(true)
      setHasNftOnly(false)
      setValue('hasPhysicalOnly', true)
      setValue('hasNftOnly', false)
    }
  }, [isPhysicalOnly, setValue])

  // Surveiller les changements des options de tarification
  const handlePricingOptionChange = (option: 'hasPhysicalOnly' | 'hasNftOnly' | 'hasNftPlusPhysical', checked: boolean) => {
    if (isFormReadOnly || isPhysicalOnly) return

    switch (option) {
      case 'hasPhysicalOnly':
        setHasPhysicalOnly(checked)
        break
      case 'hasNftOnly':
        setHasNftOnly(checked)
        break
      case 'hasNftPlusPhysical':
        setHasNftPlusPhysical(checked)
        // Si l'option NFT+Physique est cochée, activer automatiquement les deux autres options
        if (checked) {
          setHasPhysicalOnly(true)
          setHasNftOnly(true)
          setValue('hasPhysicalOnly', true)
          setValue('hasNftOnly', true)
        }
        break
    }
  }
  
  // Effet pour déterminer quelles sections afficher en fonction des relations présentes
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      // Détection du PhysicalItem
      if (initialData.physicalItem) {
        // Cocher la case "Œuvre physique" et activer la section
        setHasPhysicalItem(true)
        setHasPhysicalOnly(true)
        setInitialPhysicalOnly(true)
        
        // Enregistrer cette option dans le formulaire
        setValue('hasPhysicalOnly', true)
        
        // Mettre à jour les valeurs du formulaire avec les données du PhysicalItem
        if (initialData.physicalItem.price) {
          setValue('pricePhysicalBeforeTax', initialData.physicalItem.price.toString())
        }
        if (initialData.physicalItem.initialQty) {
          // Convertir la quantité en chaîne de caractères pour éviter l'erreur "Expected string, received number"
          setValue('initialQty', initialData.physicalItem.initialQty.toString())
        }
        if (initialData.physicalItem.height) {
          setValue('height', initialData.physicalItem.height.toString())
        }
        if (initialData.physicalItem.width) {
          setValue('width', initialData.physicalItem.width.toString())
        }
        if (initialData.physicalItem.weight) {
          setValue('weight', initialData.physicalItem.weight.toString())
        }
        if (initialData.physicalItem.creationYear) {
          setValue('creationYear', initialData.physicalItem.creationYear.toString())
        }
        if (initialData.physicalItem.shippingAddressId) {
          setValue('shippingAddressId', initialData.physicalItem.shippingAddressId.toString())
        }
      }
      
      // Initialiser les caractéristiques artistiques depuis Item
      if (initialData.mediumId) {
        setValue('mediumId', initialData.mediumId.toString())
      }
      if (initialData.styleId) {
        setValue('styleId', initialData.styleId.toString())
      }
      if (initialData.techniqueId) {
        setValue('techniqueId', initialData.techniqueId.toString())
      }
      
      // Détection du NftItem
      if (initialData.nftItem) {
        // Cocher la case "NFT" et activer la section
        setHasNftItem(true)
        setHasNftOnly(true)
        setInitialNftOnly(true)
        
        // Enregistrer cette option dans le formulaire
        setValue('hasNftOnly', true)
        
        // Mettre à jour les valeurs du formulaire avec les données du NftItem
        if (initialData.nftItem.price) {
          setValue('priceNftBeforeTax', initialData.nftItem.price.toString())
        }
        
        // Vérifier si un certificat d'authenticité est associé
        if (initialData.certificateUrl) {
          setHasCertificate(true)
          setValue('certificate', initialData.certificateUrl)
        }
      }
      
      // Si les deux options sont présentes, activer aussi l'option combinée
      if (initialData.physicalItem && initialData.nftItem) {
        setHasNftPlusPhysical(true)
        setValue('hasNftPlusPhysical', true)
      }
    }
  }, [mode, initialData, setValue])
  
  // Wrapper pour onSubmit qui vérifie les options de tarification et gère la suppression des items
  const onSubmit = async (data: any) => {
    // Vérifier qu'au moins une option de tarification est cochée
    if (!hasPhysicalOnly && !hasNftOnly) {
      errorToast('Vous devez sélectionner au moins une option de tarification')
      return
    }
    
    try {
      // Si nous sommes en mode édition
      if (mode === 'edit' && initialData?.id) {
        console.log('initialData.physicalItem', initialData.physicalItem)
        console.log('hasPhysicalOnly', hasPhysicalOnly)
        console.log('initialData.nftItem', initialData.nftItem)
        console.log('hasNftOnly', hasNftOnly)
        
        // Gérer la suppression du PhysicalItem si l'option a été décochée
        if (initialData.physicalItem && !hasPhysicalOnly) {
          try {
            console.log('3')
            const physicalItemId = initialData.physicalItem.id
            if (physicalItemId) {
              await deletePhysicalItem(physicalItemId)
              console.log('PhysicalItem supprimé:', physicalItemId)
            } else {
              console.log('Impossible de supprimer PhysicalItem: ID manquant')
            }
          } catch (error) {
            console.error('Erreur lors de la suppression du PhysicalItem:', error)
            errorToast('Erreur lors de la suppression de l\'item physique')
          }
        }
        
       
      }
      
      // Appeler la fonction onSubmit originale
      await originalOnSubmit(data)
    } catch (error) {
      console.error('Erreur lors de la soumission du formulaire:', error)
      errorToast('Une erreur est survenue lors de la soumission du formulaire')
    }
  }
  
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full">
      {isFormReadOnly && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm font-medium text-amber-800 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span>Au moins un élément est listé, vous ne pouvez pas modifier l'œuvre.</span>
          </div>
        </div>
      )}
      
      <MainInfoSection 
        register={register} 
        errors={errors}
        setValue={setValue} 
        control={control}
        getValues={getValues}
        slug={localSlug}
        title={localTitle}
        onNameChange={handleNameChange}
        isFormReadOnly={isFormReadOnly}
      />
      
      <SeoSection 
        register={register} 
        errors={errors}
        setValue={setValue} 
        control={control}
        getValues={getValues}
        isFormReadOnly={isFormReadOnly}
      />
      
      {/* Section de tarification - masquée pour les œuvres physiques et en mode édition */}
      {!isPhysicalOnly && mode !== 'edit' && (
        <PricingSection 
          register={register} 
          errors={errors}
          setValue={setValue}
          control={control}
          getValues={getValues}
          hasPhysicalOnly={hasPhysicalOnly}
          hasNftOnly={hasNftOnly}
          hasNftPlusPhysical={hasNftPlusPhysical}
          onPricingOptionChange={handlePricingOptionChange}
          isEditMode={isEditMode}
          physicalItemStatus={physicalItemStatus}
          nftItemStatus={nftItemStatus}
          isFormReadOnly={isFormReadOnly}
          isPhysicalOnly={isPhysicalOnly}
        />
      )}
      
      {/* Conditionnellement afficher la section des propriétés physiques basé uniquement sur l'état de la checkbox ou isPhysicalOnly */}
      {(hasPhysicalOnly || isPhysicalOnly) && (
        <PhysicalPropertiesSection 
          register={register} 
          errors={errors}
          setValue={setValue} 
          control={control}
          getValues={getValues}
          isFormReadOnly={isFormReadOnly}
        />
      )}
      
      {/* Section des caractéristiques artistiques (Support, Style, Technique) */}
      <ArtworkCharacteristicsSection 
        register={register} 
        errors={errors}
        setValue={setValue} 
        control={control}
        getValues={getValues}
        isFormReadOnly={isFormReadOnly}
        mediums={mediums}
        styles={artStyles}
        techniques={techniques}
      />
      
      {/* Section adresse d'expédition pour les œuvres physiques */}
      {(hasPhysicalOnly || isPhysicalOnly) && (
        <ShippingAddressSection 
          register={register} 
          errors={errors}
          setValue={setValue} 
          control={control}
          getValues={getValues}
          isFormReadOnly={isFormReadOnly}
          addresses={addresses}
        />
      )}
      
      {/* Conditionnellement afficher la section des propriétés NFT basé uniquement sur l'état de la checkbox */}
      {hasNftOnly && (
        <NftPropertiesSection 
          register={register} 
          errors={errors}
          setValue={setValue} 
          control={control}
          getValues={getValues}
          isFormReadOnly={isFormReadOnly}
        />
      )}
      
      {/* Section commune pour les tags */}
      <TagsSection 
        register={register} 
        errors={errors}
        setValue={setValue} 
        control={control}
        getValues={getValues}
        tags={tags}
        setTags={setTags}
        isFormReadOnly={isFormReadOnly}
      />
      
      {/* Section pour les médias */}
      <MediaFilesSection 
        register={register} 
        errors={errors}
        setValue={setValue}
        control={control}
        getValues={getValues}
        isEditMode={isEditMode}
        initialImageUrl={initialData?.imageUrl}
        fileInputRef={fileInputRef}
        secondaryImagesInputRef={secondaryImagesInputRef}
        handleImageChange={handleImageChange}
        handleSecondaryImagesChange={handleSecondaryImagesChange}
        isFormReadOnly={isFormReadOnly}
      />

      {/* Section certificat pour œuvre physique */}
      {(hasPhysicalOnly || isPhysicalOnly) && (
        <PhysicalCertificateSection 
          register={register} 
          errors={errors}
          setValue={setValue}
          control={control}
          getValues={getValues}
          isEditMode={isEditMode}
          certificateUrl={initialData?.physicalCertificateUrl}
          fileInputRef={physicalCertificateInputRef}
          handleCertificateChange={handlePhysicalCertificateChange}
          isFormReadOnly={isFormReadOnly}
        />
      )}

      {/* Section certificat pour NFT */}
      {hasNftOnly && (
        <NftCertificateSection 
          register={register} 
          errors={errors}
          setValue={setValue}
          control={control}
          getValues={getValues}
          isEditMode={isEditMode}
          certificateUrl={initialData?.nftCertificateUrl}
          fileInputRef={nftCertificateInputRef}
          handleCertificateChange={handleNftCertificateChange}
          isFormReadOnly={isFormReadOnly}
        />
      )}
      
      {/* Prévisualisations des images */}
      {previewImages.length > 0 && (
        <ImagePreview 
          images={previewImages}
          label={isEditMode && initialData?.imageUrl ? "Image principale existante" : ""}
        />
      )}
      
      {/* Prévisualisations des images secondaires */}
      {secondaryImages.length > 0 && (
        <ImagePreview 
          images={secondaryImages}
          label={secondaryImages.length > 0 ? `Images secondaires existantes (${secondaryImages.length})` : ""}
          onRemove={!isFormReadOnly ? removeSecondaryImage : undefined}
          isExistingImage={isExistingImage}
        />
      )}
      
      {/* Prévisualisation du certificat d'œuvre physique */}
      {(hasPhysicalOnly || isPhysicalOnly) && (previewPhysicalCertificate || initialData?.physicalCertificateUrl) && (
        <div className="mt-4 bg-black/5 p-4 rounded-lg">
          <h4>Certificat d'œuvre physique</h4>
          <div className="flex flex-col items-center">
            {previewPhysicalCertificate ? (
              <PdfPreview 
                url={previewPhysicalCertificate}
                certificateFile={physicalCertificateInputRef.current?.files?.[0] || null}
              />
            ) : initialData?.physicalCertificateUrl ? (
              <a 
                href={initialData.physicalCertificateUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="mt-2 text-primary underline hover:text-primary-dark"
              >
                Voir le certificat d'œuvre physique existant
              </a>
            ) : null}
          </div>
        </div>
      )}

      {/* Prévisualisation du certificat NFT */}
      {hasNftOnly && (previewNftCertificate || initialData?.nftCertificateUrl) && (
        <div className="mt-4 bg-black/5 p-4 rounded-lg">
          <h4>Certificat NFT</h4>
          <div className="flex flex-col items-center">
            {previewNftCertificate ? (
              <PdfPreview 
                url={previewNftCertificate}
                certificateFile={nftCertificateInputRef.current?.files?.[0] || null}
              />
            ) : initialData?.nftCertificateUrl ? (
              <a 
                href={initialData.nftCertificateUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="mt-2 text-primary underline hover:text-primary-dark"
              >
                Voir le certificat NFT existant
              </a>
            ) : null}
          </div>
        </div>
      )}
      
      {/* Actions du formulaire */}
      <div className="flex justify-end gap-4 mt-10 pt-8 border-t border-gray-200 dark:border-gray-700">
        <Button
          type="button"
          variant="secondary"
          size="medium"
          onClick={() => router.back()}
          className="min-w-[120px]"
        >
          Annuler
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="medium"
          disabled={isSubmitting || isFormReadOnly}
          isLoading={isSubmitting}
          loadingText="Traitement en cours..."
          className="min-w-[160px]"
        >
          {isEditMode ? 'Mettre à jour' : 'Créer l\'œuvre'}
        </Button>
      </div>
    </form>
  )
} 