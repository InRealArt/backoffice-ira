'use client'

import { NftCertificateSectionProps } from '../types'
import FormSection from '../FormSection'

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
    <FormSection title="Certificat NFT" bgVariant="subtle-4">
      {/* Certificat NFT */}
      <div className="mb-6">
        <label htmlFor="nftCertificate" className="flex items-center gap-1" data-required={!hasExistingCertificate}>
          Certificat NFT (PDF) {hasExistingCertificate ? '(optionnel - remplacer le fichier existant)' : '(obligatoire)'}
        </label>
        {hasExistingCertificate && (
          <p className="form-help">
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
          className={`form-input ${errors.nftCertificate ? 'input-error' : ''}`}
        />
        {errors.nftCertificate && (
          <p className="form-error">{errors.nftCertificate?.message ? String(errors.nftCertificate.message) : 'Le certificat est requis'}</p>
        )}
        {!isFormReadOnly && (
          <p className="form-help">
            Ce certificat sera associé au NFT. Format PDF uniquement.
          </p>
        )}
      </div>
    </FormSection>
  )
}

export default NftCertificateSection 