'use client'

import { FormFields, PricingSectionProps } from '../types'
import FormSection from '../FormSection'
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

  // Fonction pour gérer le changement d'option
  const handleOptionChange = (option: 'hasPhysicalOnly' | 'hasNftOnly' | 'hasNftPlusPhysical', checked: boolean) => {
    setValue(option, checked);
    onPricingOptionChange(option, checked);
  };

  return (
    <FormSection title="Options de tarification">
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>Type d'œuvre disponible</label>
        <div className={styles.optionsGrid}>
          {/* Option œuvre physique */}
          <div className={styles.checkboxOption}>
            <div>
              <input
                type="checkbox"
                id="hasPhysicalOnly"
                checked={hasPhysicalOnly}
                onChange={(e) => handleOptionChange('hasPhysicalOnly', e.target.checked)}
                className={styles.checkbox}
              />
              <label htmlFor="hasPhysicalOnly" className={styles.checkboxLabel}>
                Œuvre physique
              </label>
            </div>
          </div>
          
          {/* Option NFT */}
          <div className={styles.checkboxOption}>
            <div>
              <input
                type="checkbox"
                id="hasNftOnly"
                checked={hasNftOnly}
                onChange={(e) => handleOptionChange('hasNftOnly', e.target.checked)}
                className={styles.checkbox}
              />
              <label htmlFor="hasNftOnly" className={styles.checkboxLabel}>
                NFT
              </label>
            </div>
          </div>
        </div>
        
        {errors.root && typeof errors.root.message === 'string' && errors.root.message.includes("tarification") && (
          <p className={styles.formError}>Vous devez sélectionner au moins une option de tarification</p>
        )}
      </div>
    </FormSection>
  )
}

export default PricingSection 