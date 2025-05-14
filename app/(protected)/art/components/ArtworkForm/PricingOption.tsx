'use client'

import { PricingOptionProps } from './types'
import styles from '../ArtworkForm.module.scss'

export default function PricingOption({ 
  id, 
  label, 
  register, 
  priceFieldId, 
  priceFieldRegister, 
  errors, 
  isChecked 
}: PricingOptionProps) {
  return (
    <div className={styles.pricingOption}>
      <div>
        <input 
          type="checkbox" 
          id={id} 
          {...register(id)} 
          className={styles.formCheckbox}
        />
        <label htmlFor={id}>{label}</label>
      </div>
      
      {isChecked && (
        <div className={styles.priceField}>
          <label htmlFor={priceFieldId} className={styles.formLabel} data-required={true}>
            Prix HT
          </label>
          <input
            id={priceFieldId}
            type="number"
            {...priceFieldRegister}
            className={`${styles.formInput} ${errors[priceFieldId] ? styles.formInputError : ''}`}
            placeholder="Prix HT en euros"
          />
          {errors[priceFieldId] && <span className={styles.formError}>{String(errors[priceFieldId]?.message || "Le prix est requis")}</span>}
        </div>
      )}
    </div>
  )
} 