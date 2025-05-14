import { FormFields } from '../types'
import FormSection from '../FormSection'
import styles from '../../ArtworkForm.module.scss'

function NftPropertiesSection({ register, errors, control, setValue, getValues }: FormFields) {
  return (
    <FormSection title="Caractéristiques NFT">
      {/* Prix du NFT */}
      <div className={styles.formGroup}>
        <label htmlFor="priceNftBeforeTax" className={styles.formLabel} data-required={true}>
          Prix du NFT (HT)
        </label>
        <input
          id="priceNftBeforeTax"
          type="number"
          {...register("priceNftBeforeTax", {
            required: true,
            min: {
              value: 0,
              message: "Le prix doit être supérieur ou égal à 0"
            }
          })}
          className={`${styles.formInput} ${errors.priceNftBeforeTax ? styles.formInputError : ''}`}
          placeholder="Prix HT en euros"
        />
        {errors.priceNftBeforeTax && <p className={styles.formError}>{String(errors.priceNftBeforeTax?.message || "Le prix est requis")}</p>}
      </div>
    </FormSection>
  )
}

export default NftPropertiesSection 