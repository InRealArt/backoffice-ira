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

export default function ArtworkForm({ mode = 'create', initialData = {}, onSuccess }: ArtworkFormProps) {
  // État local pour le slug et le titre
  const [localTitle, setLocalTitle] = useState(initialData?.title || '')
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
    onTitleChange: (title) => {
      setLocalTitle(title)
      setLocalSlug(normalizeString(title))
    },
    onPricingOptionsChange: {
      setHasPhysicalOnly,
      setHasNftOnly,
      setHasNftPlusPhysical
    }
  })
  
  const certificateFile = certificateInputRef.current?.files?.[0] || null
  
  // Surveiller les changements de titre depuis le formulaire
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value
    setLocalTitle(newTitle)
    setLocalSlug(normalizeString(newTitle))
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
        onTitleChange={handleTitleChange}
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
      
      <TagsSection 
        register={register} 
        errors={errors}
        setValue={setValue} 
        control={control}
        getValues={getValues}
        tags={tags}
        setTags={setTags}
      />
      
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
      <ImagePreview 
        images={previewImages}
        label={isEditMode && initialData?.imageUrl ? "Image principale existante" : ""}
      />
      
      {/* Prévisualisations des images secondaires */}
      <ImagePreview 
        images={secondaryImages}
        label={secondaryImages.length > 0 ? `Images secondaires existantes (${secondaryImages.length})` : ""}
        onRemove={removeSecondaryImage}
        isExistingImage={isExistingImage}
      />
      
      {/* Prévisualisation du certificat */}
      {previewCertificate && (
        <PdfPreview 
          url={previewCertificate} 
          certificateFile={certificateFile} 
        />
      )}

      <FormActions 
        isSubmitting={isSubmitting} 
        isEditMode={isEditMode} 
      />
    </form>
  )
} 