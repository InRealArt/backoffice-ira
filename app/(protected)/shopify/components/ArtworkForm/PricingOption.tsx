'use client'

import { PricingOptionProps } from './types'
import styles from '../ArtworkForm.module.scss'

function PricingOption({ 
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
      <div className="flex items-center mb-2">
        <input
          type="checkbox"
          id={id}
          {...register(id)}
          className="mr-2 h-4 w-4"
        />
        <label htmlFor={id} className="font-medium">{label}</label>
      </div>
      {isChecked && (
        <div className="mt-2">
          <label htmlFor={priceFieldId} className="block text-sm mb-1">Prix (€ HT)</label>
          <input
            type="text"
            id={priceFieldId}
            {...priceFieldRegister}
            className={`${styles.formInput} ${errors[priceFieldId] ? styles.formInputError : ''}`}
            placeholder="Prix HT"
          />
          {errors[priceFieldId] && (
            <p className={styles.formError}>{errors[priceFieldId].message}</p>
          )}
        </div>
      )}
    </div>
  )
}

export default PricingOption 