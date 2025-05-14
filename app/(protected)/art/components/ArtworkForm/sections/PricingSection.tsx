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
    setValue(option, checked)
    onPricingOptionChange(option, checked)
  }

  return (
    <FormSection title="Options de tarification - Types d'oeuvre">
      <div className={styles.formGroup}>
        <label className={styles.formLabel} data-required={true}>Sélectionnez le type d'œuvre</label>
        <p className={styles.formHelp}>
          Choisissez le type d'œuvre que vous souhaitez créer. Les champs spécifiques apparaîtront en fonction de votre sélection.
        </p>
        
        <div className={styles.pricingOptions}>
          {/* Option œuvre physique */}
          <div className={`${styles.pricingOption} ${hasPhysicalOnly ? styles.selected : ''}`}>
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
            <p className={styles.optionDescription}>
              Une œuvre d'art traditionnelle avec des propriétés physiques (dimensions, poids, etc.)
            </p>
          </div>
          
          {/* Option NFT */}
          <div className={`${styles.pricingOption} ${hasNftOnly ? styles.selected : ''}`}>
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
            <p className={styles.optionDescription}>
              Une œuvre d'art numérique certifiée sur la blockchain
            </p>
          </div>
        </div>
        
        {errors.root && typeof errors.root.message === 'string' && errors.root.message.includes("tarification") && (
          <p className={styles.formError}>Vous devez sélectionner au moins une option de type d'œuvre</p>
        )}
      </div>
    </FormSection>
  )
}

export default PricingSection 