'use client'

import { PhysicalCertificateSectionProps } from '../types'
import FormSection from '../FormSection'
import styles from '../../ArtworkForm.module.scss'

function PhysicalCertificateSection({
  register,
  errors,
  setValue,
  control,
  getValues,
  isEditMode,
  certificateUrl,
  fileInputRef,
  handleCertificateChange,
  isFormReadOnly
}: PhysicalCertificateSectionProps) {
  return (
    <FormSection title="Certificat Œuvre Physique">
      {/* Certificat d'œuvre physique */}
      <div className={styles.formGroup}>
        <label htmlFor="physicalCertificate" className={styles.formLabel} data-required={!isEditMode || !certificateUrl}>
          Certificat d'œuvre physique (PDF) {isEditMode && certificateUrl ? '(optionnel)' : ''}
        </label>
        {isEditMode && certificateUrl && (
          <p className={styles.formHelp}>
            Un certificat existe déjà. Vous pouvez le remplacer en sélectionnant un nouveau fichier.
          </p>
        )}
        <input
          id="physicalCertificate"
          type="file"
          accept="application/pdf"
          onChange={(e) => {
            handleCertificateChange(e)
            if (e.target.files) {
              setValue('physicalCertificate', e.target.files as unknown as FileList, { shouldValidate: true })
            }
          }}
          ref={fileInputRef}
          disabled={isFormReadOnly}
          className={`${styles.formFileInput} ${errors.physicalCertificate ? styles.formInputError : ''}`}
        />
        {errors.physicalCertificate && (
          <p className={styles.formError}>{errors.physicalCertificate?.message ? String(errors.physicalCertificate.message) : 'Le certificat est requis'}</p>
        )}
        {!isFormReadOnly && (
          <p className={styles.formHelp}>
            Ce certificat sera associé à l'œuvre physique. Format PDF uniquement.
          </p>
        )}
      </div>
    </FormSection>
  )
}

export default PhysicalCertificateSection 