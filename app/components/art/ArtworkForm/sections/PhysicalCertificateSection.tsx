'use client'

import { PhysicalCertificateSectionProps } from '../types'
import FormSection from '../FormSection'

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
  const hasExistingCertificate = isEditMode && certificateUrl

  return (
    <FormSection title="Certificat Œuvre Physique" bgVariant="subtle-3">
      {/* Certificat d'œuvre physique */}
      <div className="mb-6">
        <label htmlFor="physicalCertificate" className="flex items-center gap-1" data-required={!hasExistingCertificate}>
          Certificat d'œuvre physique (PDF) {hasExistingCertificate ? '(optionnel - remplacer le fichier existant)' : '(obligatoire)'}
        </label>
        {hasExistingCertificate && (
          <p className="form-help">
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
          className={`form-input ${errors.physicalCertificate ? 'input-error' : ''}`}
        />
        {errors.physicalCertificate && (
          <p className="form-error">{errors.physicalCertificate?.message ? String(errors.physicalCertificate.message) : 'Le certificat est requis'}</p>
        )}
        {!isFormReadOnly && (
          <p className="form-help">
            Ce certificat sera associé à l'œuvre physique. Format PDF uniquement.
          </p>
        )}
      </div>
    </FormSection>
  )
}

export default PhysicalCertificateSection 