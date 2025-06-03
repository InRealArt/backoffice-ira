import { FormFields } from '../types'
import FormSection from '../FormSection'
import styles from '../../ArtworkForm.module.scss'
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
      <div className={styles.formGrid}>
        {/* Support/Medium */}
        <div className={styles.formGroup}>
          <label htmlFor="mediumId" className={styles.formLabel} data-required={true}>
            Support/Medium
          </label>
          <select
            id="mediumId"
            {...register("mediumId", {
              required: "Le support/medium est requis"
            })}
            className={`${styles.formSelect} ${errors.mediumId ? styles.formInputError : ''}`}
            disabled={isFormReadOnly}
          >
            <option value="">Sélectionnez un support</option>
            {mediums.map(medium => (
              <option key={medium.id} value={medium.id}>
                {medium.name}
              </option>
            ))}
          </select>
          {errors.mediumId && <p className={styles.formError}>{String(errors.mediumId?.message)}</p>}
        </div>

        {/* Style */}
        <div className={styles.formGroup}>
          <label htmlFor="styleId" className={styles.formLabel} data-required={true}>
            Style
          </label>
          <select
            id="styleId"
            {...register("styleId", {
              required: "Le style est requis"
            })}
            className={`${styles.formSelect} ${errors.styleId ? styles.formInputError : ''}`}
            disabled={isFormReadOnly}
          >
            <option value="">Sélectionnez un style</option>
            {artStyles.map(style => (
              <option key={style.id} value={style.id}>
                {style.name}
              </option>
            ))}
          </select>
          {errors.styleId && <p className={styles.formError}>{String(errors.styleId?.message)}</p>}
        </div>
      </div>

      <div className={styles.formGrid}>
        {/* Technique */}
        <div className={styles.formGroup}>
          <label htmlFor="techniqueId" className={styles.formLabel} data-required={true}>
            Technique
          </label>
          <select
            id="techniqueId"
            {...register("techniqueId", {
              required: "La technique est requise"
            })}
            className={`${styles.formSelect} ${errors.techniqueId ? styles.formInputError : ''}`}
            disabled={isFormReadOnly}
          >
            <option value="">Sélectionnez une technique</option>
            {techniques.map(technique => (
              <option key={technique.id} value={technique.id}>
                {technique.name}
              </option>
            ))}
          </select>
          {errors.techniqueId && <p className={styles.formError}>{String(errors.techniqueId?.message)}</p>}
        </div>
      </div>
    </FormSection>
  )
}

export default ArtworkCharacteristicsSection 