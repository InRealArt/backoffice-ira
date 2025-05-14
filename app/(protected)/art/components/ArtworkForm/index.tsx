'use client'

import { useState, useEffect } from 'react'
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
  MediaFilesSection,
  TagsSection,
  FormActions
} from './sections'
import { useRouter } from 'next/navigation'

export default function ArtworkForm({ mode = 'create', initialData = {}, onSuccess }: ArtworkFormProps) {
  // État local pour le slug et le titre/nom
  const [localTitle, setLocalTitle] = useState(initialData?.title || initialData?.name || '')
  const [localSlug, setLocalSlug] = useState(initialData?.slug || '')
  
  // État local pour les options de tarification
  const [hasPhysicalOnly, setHasPhysicalOnly] = useState(initialData?.hasPhysicalOnly || false)
  const [hasNftOnly, setHasNftOnly] = useState(initialData?.hasNftOnly || false)
  const [hasNftPlusPhysical, setHasNftPlusPhysical] = useState(initialData?.hasNftPlusPhysical || false)
  
  const {
    isSubmitting,
    previewImages,
    previewCertificate,
    tags,
    setTags,
    secondaryImages,
    isEditMode,
    fileInputRef,
    certificateInputRef,
    secondaryImagesInputRef,
    handleImageChange,
    handleSecondaryImagesChange,
    removeSecondaryImage,
    handleCertificateChange,
    onSubmit,
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
  
  // Surveiller les changements de titre depuis le formulaire
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value
    setLocalTitle(newName)
    setLocalSlug(normalizeString(newName))
  }
  
  // Surveiller les changements des options de tarification
  const handlePricingOptionChange = (option: 'hasPhysicalOnly' | 'hasNftOnly' | 'hasNftPlusPhysical', checked: boolean) => {
    switch (option) {
      case 'hasPhysicalOnly':
        setHasPhysicalOnly(checked)
        break
      case 'hasNftOnly':
        setHasNftOnly(checked)
        break
      case 'hasNftPlusPhysical':
        setHasNftPlusPhysical(checked)
        break
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
      />
      
      <SeoSection 
        register={register} 
        errors={errors}
        setValue={setValue} 
        control={control}
        getValues={getValues}
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
      />
      
      {/* Conditionnellement afficher la section des propriétés physiques */}
      {hasPhysicalOnly && (
        <PhysicalPropertiesSection 
          register={register} 
          errors={errors}
          setValue={setValue} 
          control={control}
          getValues={getValues}
        />
      )}
      
      {/* Conditionnellement afficher la section des propriétés NFT */}
      {hasNftOnly && (
        <NftPropertiesSection 
          register={register} 
          errors={errors}
          setValue={setValue} 
          control={control}
          getValues={getValues}
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
      />
      
      {/* Section pour les médias et certificats */}
      <MediaFilesSection 
        register={register} 
        errors={errors}
        setValue={setValue}
        control={control}
        getValues={getValues}
        isEditMode={isEditMode}
        initialImageUrl={initialData?.imageUrl}
        certificateUrl={initialData?.certificateUrl}
        fileInputRef={fileInputRef}
        certificateInputRef={certificateInputRef}
        secondaryImagesInputRef={secondaryImagesInputRef}
        handleImageChange={handleImageChange}
        handleSecondaryImagesChange={handleSecondaryImagesChange}
        handleCertificateChange={handleCertificateChange}
      />
      
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
          onRemove={removeSecondaryImage}
          isExistingImage={isExistingImage}
        />
      )}
      
      {/* Prévisualisation du certificat */}
      {previewCertificate && (
        <div className={styles.certificatePreviewContainer}>
          <h4>Certificat d'authenticité</h4>
          <div className={styles.pdfPreview}>
            <a 
              href={previewCertificate} 
              target="_blank" 
              rel="noopener noreferrer" 
              className={styles.viewPdfLink}
            >
              Voir le certificat
            </a>
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
          disabled={isSubmitting}
          className={styles.submitButton}
        >
          {isSubmitting ? 'Traitement en cours...' : isEditMode ? 'Mettre à jour' : 'Créer l\'œuvre'}
        </button>
      </div>
    </form>
  )
} 