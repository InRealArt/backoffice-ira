'use client'

import { MediaFilesSectionProps } from '../types'
import FormSection from '../FormSection'
import styles from '../../ArtworkForm.module.scss'

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
    <FormSection title="Fichiers Media">
      {/* Image Principale */}
      <div className={styles.formGroup}>
        <label htmlFor="images" className={styles.formLabel} data-required={!isEditMode || !initialImageUrl}>
          Image Principale {isEditMode && initialImageUrl ? '(optionnelle)' : ''}
        </label>
        {isEditMode && initialImageUrl && (
          <p className={styles.formHelp}>
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
          className={`${styles.formFileInput} ${errors.images && (!isEditMode || !initialImageUrl) ? styles.formInputError : ''}`}
        />
        {errors.images && (!isEditMode || !initialImageUrl) && (
          <p className={styles.formError}>{errors.images?.message ? String(errors.images.message) : 'L\'image principale est requise'}</p>
        )}
      </div>
      
      {/* Images secondaires */}
      <div className={styles.formGroup}>
        <label htmlFor="secondaryImages" className={styles.formLabel}>
          Images secondaires
        </label>
        <p className={styles.formHelp}>
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
          className={styles.formFileInput}
        />
      </div>
    </FormSection>
  )
}

export default MediaFilesSection 