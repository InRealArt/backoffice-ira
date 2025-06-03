import { FormFields } from '../types'
import FormSection from '../FormSection'
import styles from '../../ArtworkForm.module.scss'

interface PhysicalPropertiesSectionProps extends FormFields {
  isFormReadOnly?: boolean
}

function PhysicalPropertiesSection({ 
  register, 
  errors, 
  control, 
  setValue, 
  getValues,
  isFormReadOnly = false
}: PhysicalPropertiesSectionProps) {
  return (
    <FormSection title="Caractéristiques physiques">
      <div className={styles.formGrid}>
        {/* Prix de l'œuvre physique */}
        <div className={styles.formGroup}>
          <label htmlFor="pricePhysicalBeforeTax" className={styles.formLabel} data-required={true}>
            Prix de l'œuvre physique (HT)
          </label>
          <input
            id="pricePhysicalBeforeTax"
            type="number"
            {...register("pricePhysicalBeforeTax", {
              required: true,
              min: {
                value: 0,
                message: "Le prix doit être supérieur ou égal à 0"
              }
            })}
            className={`${styles.formInput} ${errors.pricePhysicalBeforeTax ? styles.formInputError : ''}`}
            placeholder="Prix HT en euros"
            disabled={isFormReadOnly}
          />
          {errors.pricePhysicalBeforeTax && <p className={styles.formError}>{String(errors.pricePhysicalBeforeTax?.message || "Le prix est requis")}</p>}
        </div>

        {/* Quantité initiale */}
        <div className={styles.formGroup}>
          <label htmlFor="initialQty" className={styles.formLabel} data-required={true}>
            Quantité disponible
          </label>
          <input
            id="initialQty"
            type="number"
            {...register("initialQty", {
              required: true,
              min: {
                value: 1,
                message: "La quantité doit être au moins de 1"
              }
            })}
            className={`${styles.formInput} ${errors.initialQty ? styles.formInputError : ''}`}
            placeholder="Quantité disponible"
            disabled={isFormReadOnly}
          />
          {errors.initialQty && <p className={styles.formError}>{String(errors.initialQty?.message || "La quantité est requise")}</p>}
        </div>
      </div>

      <div className={styles.formGrid}>
        {/* Largeur */}
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
              validate: value => !isNaN(parseFloat(value)) || "La largeur doit être un nombre valide"
            })}
            className={`${styles.formInput} ${errors.width ? styles.formInputError : ''}`}
            placeholder="Largeur en cm"
            disabled={isFormReadOnly}
          />
          {errors.width && <p className={styles.formError}>{String(errors.width?.message || "La largeur est requise")}</p>}
        </div>

        {/* Hauteur */}
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
              validate: value => !isNaN(parseFloat(value)) || "La hauteur doit être un nombre valide"
            })}
            className={`${styles.formInput} ${errors.height ? styles.formInputError : ''}`}
            placeholder="Hauteur en cm"
            disabled={isFormReadOnly}
          />
          {errors.height && <p className={styles.formError}>{String(errors.height?.message || "La hauteur est requise")}</p>}
        </div>
      </div>

      <div className={styles.formGrid}>
        {/* Poids */}
        <div className={styles.formGroup}>
          <label htmlFor="weight" className={styles.formLabel} data-required={true}>
            Poids (kg)
          </label>
          <input
            id="weight"
            type="number"
            step="0.01"
            {...register("weight", {
              required: true
            })}
            className={`${styles.formInput} ${errors.weight ? styles.formInputError : ''}`}
            placeholder="Poids en kg"
            disabled={isFormReadOnly}
          />
          {errors.weight && <p className={styles.formError}>{String(errors.weight?.message || "Le poids est requis")}</p>}
        </div>

        {/* Année de création */}
        <div className={styles.formGroup}>
          <label htmlFor="creationYear" className={styles.formLabel}>
            Année de création
          </label>
          <input
            id="creationYear"
            type="number"
            max={new Date().getFullYear()}
            {...register("creationYear")}
            className={`${styles.formInput} ${errors.creationYear ? styles.formInputError : ''}`}
            placeholder="Année de création"
            disabled={isFormReadOnly}
          />
          {errors.creationYear && <p className={styles.formError}>{String(errors.creationYear?.message)}</p>}
        </div>
      </div>
    </FormSection>
  )
}

export default PhysicalPropertiesSection