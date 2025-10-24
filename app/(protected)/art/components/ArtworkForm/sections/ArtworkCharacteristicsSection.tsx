import { FormFields } from '../types'
import FormSection from '../FormSection'
import { ArtworkMedium, ArtworkStyle, ArtworkTechnique } from '@prisma/client'

interface ArtworkCharacteristicsSectionProps extends FormFields {
  mediums?: ArtworkMedium[]
  styles?: ArtworkStyle[]
  techniques?: ArtworkTechnique[]
  isFormReadOnly?: boolean
}

function ArtworkCharacteristicsSection({ 
  register, 
  errors, 
  control, 
  setValue, 
  getValues,
  mediums = [],
  styles: artStyles = [],
  techniques = [],
  isFormReadOnly = false
}: ArtworkCharacteristicsSectionProps) {
  return (
    <FormSection title="Caractéristiques artistiques">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
        {/* Support/Medium */}
        <div className="mb-6">
          <label htmlFor="mediumId" className="flex items-center gap-1" data-required={true}>
            Support/Medium
          </label>
          <select
            id="mediumId"
            {...register("mediumId", {
              required: "Le support/medium est requis"
            })}
            className={`form-select ${errors.mediumId ? 'input-error' : ''}`}
            disabled={isFormReadOnly}
          >
            <option value="">Sélectionnez un support</option>
            {mediums.map(medium => (
              <option key={medium.id} value={medium.id}>
                {medium.name}
              </option>
            ))}
          </select>
          {errors.mediumId && <p className="form-error">{String(errors.mediumId?.message)}</p>}
        </div>

        {/* Style */}
        <div className="mb-6">
          <label htmlFor="styleId" className="flex items-center gap-1" data-required={true}>
            Style
          </label>
          <select
            id="styleId"
            {...register("styleId", {
              required: "Le style est requis"
            })}
            className={`form-select ${errors.styleId ? 'input-error' : ''}`}
            disabled={isFormReadOnly}
          >
            <option value="">Sélectionnez un style</option>
            {artStyles.map(style => (
              <option key={style.id} value={style.id}>
                {style.name}
              </option>
            ))}
          </select>
          {errors.styleId && <p className="form-error">{String(errors.styleId?.message)}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
        {/* Technique */}
        <div className="mb-6">
          <label htmlFor="techniqueId" className="flex items-center gap-1" data-required={true}>
            Technique
          </label>
          <select
            id="techniqueId"
            {...register("techniqueId", {
              required: "La technique est requise"
            })}
            className={`form-select ${errors.techniqueId ? 'input-error' : ''}`}
            disabled={isFormReadOnly}
          >
            <option value="">Sélectionnez une technique</option>
            {techniques.map(technique => (
              <option key={technique.id} value={technique.id}>
                {technique.name}
              </option>
            ))}
          </select>
          {errors.techniqueId && <p className="form-error">{String(errors.techniqueId?.message)}</p>}
        </div>
      </div>
    </FormSection>
  )
}

export default ArtworkCharacteristicsSection 