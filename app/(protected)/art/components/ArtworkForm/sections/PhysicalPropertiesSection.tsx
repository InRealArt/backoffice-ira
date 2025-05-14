import { FormFields } from '../types'
import FormSection from '../FormSection'
import styles from '../../ArtworkForm.module.scss'

function PhysicalPropertiesSection({ register, errors, control, setValue, getValues }: FormFields) {
  return (
    <FormSection title="Caractéristiques physiques">
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
        />
        {errors.initialQty && <p className={styles.formError}>{String(errors.initialQty?.message || "La quantité est requise")}</p>}
      </div>

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