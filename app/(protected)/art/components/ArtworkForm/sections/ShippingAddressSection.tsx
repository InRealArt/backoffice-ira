'use client'

import { Control, FieldErrors, UseFormRegister, UseFormSetValue, UseFormGetValues } from 'react-hook-form'
import { ArtworkFormData, Address } from '../types'
import FormSection from '../FormSection'

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
    <FormSection title="Adresse d'expédition" bgVariant="subtle-5">
      <p className="form-help mb-4">
        Sélectionnez l'adresse depuis laquelle l'œuvre physique sera expédiée
      </p>

      <div className="mb-6">
        <label htmlFor="shippingAddressId" className="flex items-center gap-1" data-required={true}>
          Adresse d'expédition
        </label>
        <select
          id="shippingAddressId"
          {...register('shippingAddressId', {
            required: 'L\'adresse d\'expédition est obligatoire'
          })}
          className={`form-select ${errors.shippingAddressId ? 'input-error' : ''}`}
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
          <p className="form-error">{errors.shippingAddressId.message as string}</p>
        )}

        {addresses.length === 0 && (
          <div className="form-help text-red-600 mt-2">
            Aucune adresse disponible. Veuillez d'abord créer une adresse dans votre profil.
          </div>
        )}
      </div>
    </FormSection>
  )
} 