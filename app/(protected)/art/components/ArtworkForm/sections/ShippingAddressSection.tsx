'use client'

import { Control, FieldErrors, UseFormRegister, UseFormSetValue, UseFormGetValues } from 'react-hook-form'
import { ArtworkFormData, Address } from '../types'
import FormSection from '../FormSection'
import styles from '../../ArtworkForm.module.scss'

interface ShippingAddressSectionProps {
  register: UseFormRegister<ArtworkFormData>
  errors: FieldErrors<ArtworkFormData>
  setValue: UseFormSetValue<ArtworkFormData>
  control: Control<ArtworkFormData>
  getValues: UseFormGetValues<ArtworkFormData>
  isFormReadOnly: boolean
  addresses: Address[]
}

export default function ShippingAddressSection({
  register,
  errors,
  setValue,
  control,
  getValues,
  isFormReadOnly,
  addresses
}: ShippingAddressSectionProps) {
  const formatAddressOption = (address: Address) => {
    return `${address.name} - ${address.firstName} ${address.lastName}, ${address.streetAddress}, ${address.postalCode} ${address.city}, ${address.country}`
  }

  return (
    <FormSection title="Adresse d'expédition">
      <p className={styles.formHelp} style={{ marginBottom: '1rem' }}>
        Sélectionnez l'adresse depuis laquelle l'œuvre physique sera expédiée
      </p>

      <div className={styles.formGroup}>
        <label htmlFor="shippingAddressId" className={styles.formLabel} data-required={true}>
          Adresse d'expédition
        </label>
        <select
          id="shippingAddressId"
          {...register('shippingAddressId', {
            required: 'L\'adresse d\'expédition est obligatoire'
          })}
          className={`${styles.formSelect} ${errors.shippingAddressId ? styles.formInputError : ''}`}
          disabled={isFormReadOnly}
        >
          <option value="">Sélectionnez une adresse</option>
          {addresses.map((address) => (
            <option key={address.id} value={address.id}>
              {formatAddressOption(address)}
            </option>
          ))}
        </select>
        {errors.shippingAddressId && (
          <p className={styles.formError}>{errors.shippingAddressId.message}</p>
        )}

        {addresses.length === 0 && (
          <div className={styles.formHelp} style={{ color: '#ff4444', marginTop: '0.5rem' }}>
            Aucune adresse disponible. Veuillez d'abord créer une adresse dans votre profil.
          </div>
        )}
      </div>
    </FormSection>
  )
} 