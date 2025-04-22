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
  certificateUrl,
  fileInputRef,
  certificateInputRef,
  secondaryImagesInputRef,
  handleImageChange,
  handleSecondaryImagesChange,
  handleCertificateChange
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
          className={styles.formFileInput}
        />
      </div>
      
      {/* Certificat d'authenticité */}
      <div className={styles.formGroup}>
        <label htmlFor="certificate" className={styles.formLabel} data-required={!isEditMode || !certificateUrl}>
          Certificat d'authenticité (PDF) {isEditMode && certificateUrl ? '(optionnel)' : ''}
        </label>
        {isEditMode && certificateUrl && (
          <p className={styles.formHelp}>
            Un certificat existe déjà. Vous pouvez le remplacer en sélectionnant un nouveau fichier.
          </p>
        )}
        <input
          id="certificate"
          type="file"
          accept="application/pdf"
          onChange={(e) => {
            handleCertificateChange(e)
            if (e.target.files) {
              setValue('certificate', e.target.files as unknown as FileList, { shouldValidate: true })
            }
          }}
          ref={certificateInputRef}
          className={`${styles.formFileInput} ${errors.certificate ? styles.formInputError : ''}`}
        />
        {errors.certificate && (
          <p className={styles.formError}>{errors.certificate?.message ? String(errors.certificate.message) : 'Le certificat est requis'}</p>
        )}
      </div>
    </FormSection>
  )
}

export default MediaFilesSection 