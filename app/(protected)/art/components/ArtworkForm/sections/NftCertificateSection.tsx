'use client'

import { NftCertificateSectionProps } from '../types'
import FormSection from '../FormSection'
import styles from '../../ArtworkForm.module.scss'

function NftCertificateSection({
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
}: NftCertificateSectionProps) {
  const hasExistingCertificate = isEditMode && certificateUrl

  return (
    <FormSection title="Certificat NFT">
      {/* Certificat NFT */}
      <div className={styles.formGroup}>
        <label htmlFor="nftCertificate" className={styles.formLabel} data-required={!hasExistingCertificate}>
          Certificat NFT (PDF) {hasExistingCertificate ? '(optionnel - remplacer le fichier existant)' : '(obligatoire)'}
        </label>
        {hasExistingCertificate && (
          <p className={styles.formHelp}>
            Un certificat existe déjà. Vous pouvez le remplacer en sélectionnant un nouveau fichier.
          </p>
        )}
        <input
          id="nftCertificate"
          type="file"
          accept="application/pdf"
          onChange={(e) => {
            handleCertificateChange(e)
            if (e.target.files) {
              setValue('nftCertificate', e.target.files as unknown as FileList, { shouldValidate: true })
            }
          }}
          ref={fileInputRef}
          disabled={isFormReadOnly}
          className={`${styles.formFileInput} ${errors.nftCertificate ? styles.formInputError : ''}`}
        />
        {errors.nftCertificate && (
          <p className={styles.formError}>{errors.nftCertificate?.message ? String(errors.nftCertificate.message) : 'Le certificat est requis'}</p>
        )}
        {!isFormReadOnly && (
          <p className={styles.formHelp}>
            Ce certificat sera associé au NFT. Format PDF uniquement.
          </p>
        )}
      </div>
    </FormSection>
  )
}

export default NftCertificateSection 