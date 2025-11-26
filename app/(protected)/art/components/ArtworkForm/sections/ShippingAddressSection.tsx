'use client'

import { Control, FieldErrors, UseFormRegister, UseFormSetValue, UseFormGetValues } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { ArtworkFormData, Address } from '../types'
import FormSection from '../FormSection'
import { Plus } from 'lucide-react'

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
  const router = useRouter()
  
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
        <div className="flex items-start gap-3">
          <div className="flex-1 max-w-md">
            <select
              id="shippingAddressId"
              {...register('shippingAddressId', {
                required: 'L\'adresse d\'expédition est obligatoire'
              })}
              className={`form-select w-full ${errors.shippingAddressId ? 'input-error' : ''}`}
              disabled={isFormReadOnly}
            >
              <option value="">Sélectionnez une adresse</option>
              {addresses.map((address) => (
                <option key={address.id} value={address.id}>
                  {formatAddressOption(address)}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={() => router.push('/art/addresses/create')}
            disabled={isFormReadOnly}
            className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus size={16} />
            Créer une adresse
          </button>
        </div>
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