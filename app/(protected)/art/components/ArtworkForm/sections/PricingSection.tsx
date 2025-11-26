'use client'

import { FormFields, PricingSectionProps } from '../types'
import FormSection from '../FormSection'
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
  onPricingOptionChange,
  isEditMode,
  physicalItemStatus,
  nftItemStatus,
  isFormReadOnly,
  isPhysicalOnly = false
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
    if (!isFormReadOnly) {
      setValue(option, checked)
      onPricingOptionChange(option, checked)
    }
  }

  // Map status to badge variant classes
  const getStatusBadgeClass = (status: string | undefined) => {
    switch (status) {
      case 'listed':
        return 'status-badge status-success'
      case 'sold':
        return 'status-badge status-info'
      case 'reserved':
        return 'status-badge status-warning'
      case 'draft':
      default:
        return 'status-badge status-default'
    }
  }

  const optionBase = 'flex-1 min-w-0 sm:min-w-[250px] border border-border rounded-md p-6 bg-background-light shadow-sm transition-all duration-200 relative overflow-hidden max-w-full';
  const optionHover = 'hover:border-gray-300 hover:shadow';
  const optionSelected = 'border-primary bg-[#f0f5ff] shadow-md before:content-[\'\'] before:absolute before:top-0 before:left-0 before:w-full before:h-1 before:bg-gradient-to-r before:from-[#4a6cf7] before:to-primary';
  const optionReadOnly = 'opacity-80 cursor-not-allowed';

  return (
    <FormSection title="Options de tarification - Types d'oeuvre" bgVariant="subtle-2">
      {!isPhysicalOnly && (
        <div className="mb-4">
          <label className="flex items-center gap-1" data-required={true}>Sélectionnez le type d'œuvre</label>
          <p className="form-help">
            Choisissez le type d'œuvre que vous souhaitez créer. Les champs spécifiques apparaîtront en fonction de votre sélection.
            {isFormReadOnly && (
              <span className="block mt-2 p-2 bg-red-100 text-red-700 rounded text-sm font-semibold">
                Au moins un des éléments est listé, l'oeuvre est non modifiable.
              </span>
            )}
          </p>
        </div>
      )}
      
      <div className="flex flex-col gap-6 md:flex-row md:flex-wrap">
        {/* Option œuvre physique */}
        <div className={[
          optionBase,
          optionHover,
          hasPhysicalOnly ? optionSelected : '',
          isFormReadOnly ? optionReadOnly : '',
        ].filter(Boolean).join(' ')}>
          <div>
            {!isPhysicalOnly && (
              <input
                type="checkbox"
                id="hasPhysicalOnly"
                checked={hasPhysicalOnly}
                onChange={(e) => handleOptionChange('hasPhysicalOnly', e.target.checked)}
                className="mr-3 w-[18px] h-[18px]"
                disabled={isFormReadOnly}
              />
            )}
            <label htmlFor="hasPhysicalOnly" className="inline-flex items-center font-semibold text-[1.05rem] text-slate-800">
              Œuvre physique
            </label>
          </div>
          <p className="mt-3 text-sm text-slate-500 leading-snug">
            Une œuvre d'art traditionnelle avec des propriétés physiques (dimensions, poids, etc.)
          </p>
          {isEditMode && hasPhysicalOnly && physicalItemStatus && (
            <div className={getStatusBadgeClass(physicalItemStatus)}>
              Statut: {physicalItemStatus}
            </div>
          )}
        </div>
        
        {/* Option NFT - masquée si isPhysicalOnly est true */}
        {!isPhysicalOnly && (
          <div className={[
            optionBase,
            optionHover,
            hasNftOnly ? optionSelected : '',
            isFormReadOnly ? optionReadOnly : '',
          ].filter(Boolean).join(' ')}>
            <div>
              <input
                type="checkbox"
                id="hasNftOnly"
                checked={hasNftOnly}
                onChange={(e) => handleOptionChange('hasNftOnly', e.target.checked)}
                className="mr-3 w-[18px] h-[18px]"
                disabled={isFormReadOnly}
              />
              <label htmlFor="hasNftOnly" className="inline-flex items-center font-semibold text-[1.05rem] text-slate-800">
                NFT
              </label>
            </div>
            <p className="mt-3 text-sm text-slate-500 leading-snug">
              Une œuvre d'art numérique certifiée sur la blockchain
            </p>
            {isEditMode && hasNftOnly && nftItemStatus && (
              <div className={getStatusBadgeClass(nftItemStatus)}>
                Statut: {nftItemStatus}
              </div>
            )}
          </div>
        )}
      </div>

      {errors.pricingOption && (
        <p className="form-error mt-4">
          {String(errors.pricingOption?.message || "Vous devez sélectionner au moins une option")}
        </p>
      )}
    </FormSection>
  )
}

export default PricingSection 