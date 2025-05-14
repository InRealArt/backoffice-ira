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
      
      {/* Note explicative sur les propriétés intellectuelles */}
      <div className={styles.nftInfoBox}>
        <h4>Propriétés du NFT</h4>
        <p>
          Le NFT sera créé sur la blockchain Ethereum et contiendra les métadonnées de l'œuvre, 
          y compris une référence à l'image et aux informations descriptives.
        </p>
        <p>
          Assurez-vous que vous possédez les droits de propriété intellectuelle sur cette œuvre 
          avant de la transformer en NFT.
        </p>
      </div>
    </FormSection>
  )
}

export default NftPropertiesSection 