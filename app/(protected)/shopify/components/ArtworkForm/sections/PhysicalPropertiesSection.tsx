import { FormFields } from '../types'
import FormSection from '../FormSection'
import styles from '../../ArtworkForm.module.scss'

function PhysicalPropertiesSection({ register, errors }: FormFields) {
  return (
    <FormSection title="Caractéristiques">
      <div className={styles.formGrid}>
        {/* Medium */}
        <div className={styles.formGroup}>
          <label htmlFor="medium" className={styles.formLabel} data-required={true}>
            Médium / Support
          </label>
          <input
            id="medium"
            type="text"
            {...register("medium", { required: true })}
            className={`${styles.formInput} ${errors.medium ? styles.formInputError : ''}`}
            placeholder="Ex: Huile sur toile, Acrylique, etc."
          />
          {errors.medium && <p className={styles.formError}>Le médium est requis</p>}
        </div>
        
        {/* Date de création */}
        <div className={styles.formGroup}>
          <label htmlFor="creationYear" className={styles.formLabel}>
            Date de création
          </label>
          <input
            id="creationYear"
            type="number"
            {...register("creationYear")}
            className={`${styles.formInput} ${errors.creationYear ? styles.formInputError : ''}`}
            placeholder="2023"
          />
          {errors.creationYear && <p className={styles.formError}>{String(errors.creationYear?.message || '')}</p>}
        </div>
      </div>
      
      <div className={styles.formGrid}>
        {/* Width */}
        <div className={styles.formGroup}>
          <label htmlFor="width" className={styles.formLabel} data-required={true}>
            Largeur (cm)
          </label>
          <input
            id="width"
            type="number"
            step="0.01"
            {...register("width", {
              required: true,
              validate: (value) => !value || parseFloat(value) > 0 || "La largeur doit être supérieure à 0",
            })}
            className={`${styles.formInput} ${errors.width ? styles.formInputError : ''}`}
            placeholder="Largeur en cm"
          />
          {errors.width && <p className={styles.formError}>{String(errors.width?.message || "La largeur est requise")}</p>}
        </div>

        {/* Height */}
        <div className={styles.formGroup}>
          <label htmlFor="height" className={styles.formLabel} data-required={true}>
            Hauteur (cm)
          </label>
          <input
            id="height"
            type="number"
            step="0.01"
            {...register("height", {
              required: true,
              validate: (value) => !value || parseFloat(value) > 0 || "La hauteur doit être supérieure à 0",
            })}
            className={`${styles.formInput} ${errors.height ? styles.formInputError : ''}`}
            placeholder="Hauteur en cm"
          />
          {errors.height && <p className={styles.formError}>{String(errors.height?.message || "La hauteur est requise")}</p>}
        </div>
        
        {/* Weight */}
        <div className={styles.formGroup}>
          <label htmlFor="weight" className={styles.formLabel}>
            Poids (kg)
          </label>
          <input
            id="weight"
            type="text"
            {...register("weight")}
            className={`${styles.formInput} ${errors.weight ? styles.formInputError : ''}`}
            placeholder="5.2"
          />
          {errors.weight && <p className={styles.formError}>{String(errors.weight?.message || '')}</p>}
        </div>
      </div>
    </FormSection>
  )
}

export default PhysicalPropertiesSection 