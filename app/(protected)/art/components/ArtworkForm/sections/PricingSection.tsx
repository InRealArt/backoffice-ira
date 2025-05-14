'use client'

import { FormFields, PricingSectionProps } from '../types'
import FormSection from '../FormSection'
import PricingOption from '../PricingOption'
import styles from '../../ArtworkForm.module.scss'

function PricingSection({
  register,
  errors,
  setValue,
  control,
  getValues,
  hasPhysicalOnly,
  hasNftOnly,
  hasNftPlusPhysical,
  onPricingOptionChange
}: PricingSectionProps) {
  return (
    <FormSection title="Options de tarification">
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Type d'œuvre disponible</label>
        <div className={styles.pricingOptions}>
          <PricingOption 
            id="hasPhysicalOnly"
            label="Œuvre physique uniquement"
            register={register}
            priceFieldId="pricePhysicalBeforeTax"
            priceFieldRegister={register("pricePhysicalBeforeTax")}
            errors={errors}
            isChecked={hasPhysicalOnly}
          />
          
          <PricingOption 
            id="hasNftOnly"
            label="NFT uniquement"
            register={register}
            priceFieldId="priceNftBeforeTax"
            priceFieldRegister={register("priceNftBeforeTax")}
            errors={errors}
            isChecked={hasNftOnly}
          />
          
          <PricingOption 
            id="hasNftPlusPhysical"
            label="NFT + Œuvre physique"
            register={register}
            priceFieldId="priceNftPlusPhysicalBeforeTax"
            priceFieldRegister={register("priceNftPlusPhysicalBeforeTax")}
            errors={errors}
            isChecked={hasNftPlusPhysical}
          />
        </div>
        {errors.root && typeof errors.root.message === 'string' && errors.root.message.includes("tarification") && (
          <p className={styles.formError}>Vous devez sélectionner au moins une option de tarification</p>
        )}
      </div>
    </FormSection>
  )
}

export default PricingSection 