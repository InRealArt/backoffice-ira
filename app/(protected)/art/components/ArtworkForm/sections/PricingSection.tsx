'use client'

import { FormFields, PricingSectionProps } from '../types'
import FormSection from '../FormSection'
import styles from '../../ArtworkForm.module.scss'
import { useEffect, useRef } from 'react'

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

  // Référence pour éviter les rendus infinis
  const initializedRef = useRef(false);

  // Assurer que les valeurs de formulaire correspondent aux états
  useEffect(() => {
    if (!initializedRef.current) {
      // Enregistrer les valeurs correctes dans le formulaire
      register('hasPhysicalOnly');
      register('hasNftOnly');
      register('hasNftPlusPhysical');
      
      setValue('hasPhysicalOnly', hasPhysicalOnly);
      setValue('hasNftOnly', hasNftOnly);
      setValue('hasNftPlusPhysical', hasNftPlusPhysical);
      
      initializedRef.current = true;
    }
  }, [register, setValue, hasPhysicalOnly, hasNftOnly, hasNftPlusPhysical]);

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
        
        {errors.pricingOption && (
          <p className={styles.formError}>
            {errors.pricingOption?.message || "Vous devez sélectionner au moins une option"}
          </p>
        )}
      </div>
    </FormSection>
  )
}

export default PricingSection 