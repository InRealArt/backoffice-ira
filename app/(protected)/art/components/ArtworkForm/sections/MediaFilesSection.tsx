'use client'

import { MediaFilesSectionProps } from '../types'
import FormSection from '../FormSection'
import FirebaseImageUpload from '../components/FirebaseImageUpload'

function MediaFilesSection({
  register,
  errors,
  setValue,
  control,
  getValues,
  isEditMode,
  initialImageUrl,
  fileInputRef,
  secondaryImagesInputRef,
  handleImageChange,
  handleSecondaryImagesChange,
  isFormReadOnly,
  artistName = '',
  artistSurname = '',
  artworkName = '',
  onMainImageUploaded
}: MediaFilesSectionProps) {
  const handleImageUploaded = (imageUrl: string) => {
    // Mettre à jour le formulaire avec l'URL de l'image
    setValue('mainImageUrl', imageUrl, { shouldValidate: true })
    if (onMainImageUploaded) {
      onMainImageUploaded(imageUrl)
    }
  }

  return (
    <FormSection title="Fichiers Media" bgVariant="subtle-2">
      {/* Image Principale */}
      <div className="mb-6">
        <label htmlFor="mainImage" className="flex items-center gap-1" data-required={!isEditMode || !initialImageUrl}>
          Image Principale {isEditMode && initialImageUrl ? '(optionnelle)' : ''}
        </label>
        {isEditMode && initialImageUrl && (
          <p className="form-help">
            Une image existe déjà. Vous pouvez la remplacer en sélectionnant un nouveau fichier.
          </p>
        )}
        <FirebaseImageUpload
          onImageUploaded={handleImageUploaded}
          previewUrl={initialImageUrl}
          error={errors.mainImageUrl ? String(errors.mainImageUrl.message) : undefined}
          disabled={isFormReadOnly}
          artistName={artistName}
          artistSurname={artistSurname}
          artworkName={artworkName}
        />
        {errors.mainImageUrl && (!isEditMode || !initialImageUrl) && (
          <p className="form-error mt-2">{errors.mainImageUrl?.message ? String(errors.mainImageUrl.message) : 'L\'image principale est requise'}</p>
        )}
      </div>
      
      {/* Images secondaires */}
      <div className="mb-6">
        <label htmlFor="secondaryImages" className="flex items-center gap-1">
          Images secondaires
        </label>
        <p className="form-help">
          Vous pouvez ajouter une ou plusieurs images secondaires qui seront affichées après l'image principale.
        </p>
        <input
          id="secondaryImages"
          type="file"
          accept="image/*"
          multiple
          onChange={handleSecondaryImagesChange}
          ref={secondaryImagesInputRef}
          disabled={isFormReadOnly}
          className="form-input"
        />
      </div>
    </FormSection>
  )
}

export default MediaFilesSection 