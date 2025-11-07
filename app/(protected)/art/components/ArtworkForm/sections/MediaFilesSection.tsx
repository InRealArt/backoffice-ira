'use client'

import { MediaFilesSectionProps } from '../types'
import FormSection from '../FormSection'

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
  isFormReadOnly
}: MediaFilesSectionProps) {
  return (
    <FormSection title="Fichiers Media" bgVariant="subtle-2">
      {/* Image Principale */}
      <div className="mb-6">
        <label htmlFor="images" className="flex items-center gap-1" data-required={!isEditMode || !initialImageUrl}>
          Image Principale {isEditMode && initialImageUrl ? '(optionnelle)' : ''}
        </label>
        {isEditMode && initialImageUrl && (
          <p className="form-help">
            Une image existe déjà. Vous pouvez la remplacer en sélectionnant un nouveau fichier.
          </p>
        )}
        <input
          id="images"
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => {
            handleImageChange(e)
            if (e.target.files) {
              setValue('images', e.target.files as unknown as FileList, { shouldValidate: true })
            }
          }}
          ref={fileInputRef}
          disabled={isFormReadOnly}
          className={`form-input ${errors.images && (!isEditMode || !initialImageUrl) ? 'input-error' : ''}`}
        />
        {errors.images && (!isEditMode || !initialImageUrl) && (
          <p className="form-error">{errors.images?.message ? String(errors.images.message) : 'L\'image principale est requise'}</p>
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