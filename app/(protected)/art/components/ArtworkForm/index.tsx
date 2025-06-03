'use client'

import { useState, useEffect, useMemo } from 'react'
import { useArtworkForm } from './useArtworkForm'
import { ArtworkFormProps } from './types'
import ImagePreview from './ImagePreview'
import PdfPreview from './PdfPreview'
import styles from '../ArtworkForm.module.scss'
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
import { deletePhysicalItem, deleteNftItem } from '@/lib/actions/prisma-actions'
import { useToast } from '@/app/components/Toast/ToastContext'

export default function ArtworkForm({ mode = 'create', addresses = [], mediums = [], styles: artStyles = [], techniques = [], initialData = {}, onSuccess }: ArtworkFormProps) {
  // État local pour le slug et le titre/nom
  const [localTitle, setLocalTitle] = useState(initialData?.title || '')
  const [localSlug, setLocalSlug] = useState(initialData?.slug || '')
  
  // État local pour les options de tarification
  const [hasPhysicalOnly, setHasPhysicalOnly] = useState(initialData?.hasPhysicalOnly || false)
  const [hasNftOnly, setHasNftOnly] = useState(initialData?.hasNftOnly || false)
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
  
  // Surveiller les changements des options de tarification
  const handlePricingOptionChange = (option: 'hasPhysicalOnly' | 'hasNftOnly' | 'hasNftPlusPhysical', checked: boolean) => {
    if (isFormReadOnly) return

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
        
        // Gérer la suppression du NftItem si l'option a été décochée
        if (initialData.nftItem && !hasNftOnly) {
          try {
            const nftItemId = initialData.nftItem.id
            if (nftItemId) {
              await deleteNftItem(nftItemId)
              console.log('NftItem supprimé:', nftItemId)
            } else {
              console.log('Impossible de supprimer NftItem: ID manquant')
            }
          } catch (error) {
            console.error('Erreur lors de la suppression du NftItem:', error)
            errorToast('Erreur lors de la suppression du NFT')
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
    <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
      <div className={styles.formHeader}>
        <h1 className={styles.formTitle}>
          {isEditMode ? 'Modifier l\'œuvre' : 'Créer une nouvelle œuvre'}
        </h1>
        <p className={styles.formSubtitle}>
          {isEditMode 
            ? 'Modifiez les informations de votre œuvre d\'art' 
            : 'Remplissez le formulaire pour ajouter une nouvelle œuvre d\'art'}
        </p>
        {isFormReadOnly && (
          <div className={styles.readOnlyWarning}>
            Au moins un élément est listé, vous ne pouvez pas modifier l'œuvre.
          </div>
        )}
      </div>
      
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
      />
      
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
      
      {/* Conditionnellement afficher la section des propriétés physiques basé uniquement sur l'état de la checkbox */}
      {hasPhysicalOnly && (
        <PhysicalPropertiesSection 
          register={register} 
          errors={errors}
          setValue={setValue} 
          control={control}
          getValues={getValues}
          isFormReadOnly={isFormReadOnly}
        />
      )}
      
      {/* Section adresse d'expédition pour les œuvres physiques */}
      {hasPhysicalOnly && (
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
      {hasPhysicalOnly && (
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
      {hasPhysicalOnly && (previewPhysicalCertificate || initialData?.physicalCertificateUrl) && (
        <div className={styles.certificatePreviewContainer}>
          <h4>Certificat d'œuvre physique</h4>
          <div className={styles.pdfPreview}>
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
                className={styles.viewPdfLink}
              >
                Voir le certificat d'œuvre physique existant
              </a>
            ) : null}
          </div>
        </div>
      )}

      {/* Prévisualisation du certificat NFT */}
      {hasNftOnly && (previewNftCertificate || initialData?.nftCertificateUrl) && (
        <div className={styles.certificatePreviewContainer}>
          <h4>Certificat NFT</h4>
          <div className={styles.pdfPreview}>
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
                className={styles.viewPdfLink}
              >
                Voir le certificat NFT existant
              </a>
            ) : null}
          </div>
        </div>
      )}
      
      {/* Actions du formulaire */}
      <div className={styles.formActions}>
        <button
          type="button"
          className={styles.cancelButton}
          onClick={() => router.back()}
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isSubmitting || isFormReadOnly}
          className={styles.submitButton}
        >
          {isSubmitting ? 'Traitement en cours...' : isEditMode ? 'Mettre à jour' : 'Créer l\'œuvre'}
        </button>
      </div>
    </form>
  )
} 