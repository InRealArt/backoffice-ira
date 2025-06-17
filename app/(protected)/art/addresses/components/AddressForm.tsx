'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Address } from '@prisma/client'
import { getCountries, Country } from '@/lib/utils'
import InputField from '@/app/components/Forms/InputField'
import styles from '@/app/components/Forms/forms.module.css'
import SimpleAutocomplete, { AddressComponents } from './SimpleAutocomplete'
import MapWithMarker, { MapLocation } from './MapWithMarker'
import GoogleMapsLoader from './GoogleMapsLoader'
import { useGeocoding } from '@/hooks/useGeocoding'


interface AddressFormProps {
  address?: Address
  defaultFirstName?: string
  defaultLastName?: string
  onSubmit: (data: {
    name: string
    firstName: string
    lastName: string
    streetAddress: string
    postalCode: string
    city: string
    country: string
    countryCode: string
    vatNumber?: string
  }) => Promise<void>
}

export default function AddressForm({ address, defaultFirstName = '', defaultLastName = '', onSubmit }: AddressFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const countries = getCountries()
  const { geocodeAddress } = useGeocoding()
  const [mapLocation, setMapLocation] = useState<MapLocation | undefined>(undefined)
  
  // Trouver le nom du pays à partir du code pays
  const findCountryName = (code: string) => {
    const country = countries.find(country => country.code === code)
    return country ? country.name : ''
  }
  
  const defaultCountryCode = address?.countryCode || 'FR'
  
  const [formData, setFormData] = useState({
    name: address?.name || '',
    firstName: address?.firstName || defaultFirstName,
    lastName: address?.lastName || defaultLastName,
    streetAddress: address?.streetAddress || '',
    postalCode: address?.postalCode || '',
    city: address?.city || '',
    country: address?.country || findCountryName(defaultCountryCode),
    countryCode: defaultCountryCode,
    vatNumber: address?.vatNumber || ''
  })

  // Géocoder automatiquement l'adresse en mode édition
  useEffect(() => {
    const geocodeExistingAddress = async () => {
      if (address && address.streetAddress && address.city) {
        const fullAddress = `${address.streetAddress}, ${address.postalCode} ${address.city}, ${address.country}`
        
        try {
          const geocodeResult = await geocodeAddress(fullAddress)
          if (geocodeResult) {
            setMapLocation({
              lat: geocodeResult.lat,
              lng: geocodeResult.lng,
              address: geocodeResult.formattedAddress
            })
          }
        } catch (error) {
          console.log('Erreur de géocodage de l\'adresse existante:', error)
        }
      }
    }

    geocodeExistingAddress()
  }, [address, geocodeAddress])
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement
    
    if (name === 'countryCode') {
      // Pour le champ de sélection de pays, mettre à jour countryCode et country
      const selectedCountry = countries.find(country => country.code === value)
      
      setFormData({
        ...formData,
        countryCode: value,
        country: selectedCountry ? selectedCountry.name : ''
      })
    } else {
      setFormData({
        ...formData,
        [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
      })
    }
  }

  const handlePlaceSelect = async (placeDetails: AddressComponents) => {
    // Mettre à jour les données du formulaire
    const updatedFormData = {
      ...formData,
      streetAddress: placeDetails.streetAddress,
      postalCode: placeDetails.postalCode,
      city: placeDetails.city,
      country: placeDetails.country,
      countryCode: placeDetails.countryCode
    }
    
    setFormData(updatedFormData)

    // Géocoder l'adresse pour obtenir les coordonnées et mettre à jour la carte
    const fullAddress = `${placeDetails.streetAddress}, ${placeDetails.postalCode} ${placeDetails.city}, ${placeDetails.country}`
    
    try {
      const geocodeResult = await geocodeAddress(fullAddress)
      if (geocodeResult) {
        setMapLocation({
          lat: geocodeResult.lat,
          lng: geocodeResult.lng,
          address: geocodeResult.formattedAddress
        })
      }
    } catch (error) {
      console.log('Erreur de géocodage, mais ce n\'est pas grave:', error)
    }
  }

  const handleAddressChange = (value: string) => {
    setFormData({
      ...formData,
      streetAddress: value
    })
  }
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (isSubmitting) return
    
    setIsSubmitting(true)
    
    try {
      await onSubmit(formData)
    } catch (error) {
      console.error('Erreur lors de la soumission du formulaire:', error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  return (
    <GoogleMapsLoader>
      <form onSubmit={handleSubmit} className="form-container">
      <InputField
        id="name"
        name="name"
        label="Nom pour l'adresse"
        value={formData.name}
        onChange={handleChange}
        placeholder="Ex: Adresse de facturation, Adresse du bureau, etc."
        required
      />
      
      <InputField
        id="firstName"
        name="firstName"
        label="Prénom"
        value={formData.firstName}
        onChange={handleChange}
        required
      />
      
      <InputField
        id="lastName"
        name="lastName"
        label="Nom"
        value={formData.lastName}
        onChange={handleChange}
        required
      />
      
      <div className="form-group">
        <label htmlFor="streetAddress" className="form-label">Adresse *</label>
        <SimpleAutocomplete
          value={formData.streetAddress}
          onAddressChange={(address) => setFormData({ ...formData, streetAddress: address })}
          onPlaceSelect={handlePlaceSelect}
          placeholder="Commencez à taper votre adresse..."
          className="form-input"
          required
        />
      </div>
      
      <div className="form-row">
        <InputField
          id="postalCode"
          name="postalCode"
          label="Code postal"
          value={formData.postalCode}
          onChange={handleChange}
          disabled={true}
          required
        />
        
        <InputField
          id="city"
          name="city"
          label="Ville"
          value={formData.city}
          onChange={handleChange}
          disabled={true}
          required
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="countryCode" className="form-label">Pays *</label>
        <select
          id="countryCode"
          name="countryCode"
          value={formData.countryCode}
          onChange={handleChange}
          className={`form-select ${styles['input-disabled']}`}
          disabled={true}
          required
        >
          {countries.map(country => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>
      </div>
      
      <InputField
        id="vatNumber"
        name="vatNumber"
        label="Numéro de TVA (pour professionnels)"
        value={formData.vatNumber}
        onChange={handleChange}
      />
      
      <div className="form-actions">
        <button
          type="button"
          onClick={() => router.push('/art/addresses')}
          className="btn btn-secondary"
          disabled={isSubmitting}
        >
          Annuler
        </button>
        <button
          type="submit"
          className="btn btn-primary btn-medium"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Enregistrement...' : address ? 'Mettre à jour' : 'Créer'}
        </button>
      </div>
    </form>
    
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Localisation</h3>
        {formData.streetAddress && formData.city && !mapLocation && (
          <button
            type="button"
            onClick={async () => {
              const fullAddress = `${formData.streetAddress}, ${formData.postalCode} ${formData.city}, ${formData.country}`
              try {
                const geocodeResult = await geocodeAddress(fullAddress)
                if (geocodeResult) {
                  setMapLocation({
                    lat: geocodeResult.lat,
                    lng: geocodeResult.lng,
                    address: geocodeResult.formattedAddress
                  })
                }
              } catch (error) {
                console.error('Erreur de géocodage:', error)
              }
            }}
            className="btn btn-secondary btn-small"
          >
            📍 Localiser sur la carte
          </button>
        )}
      </div>
      <MapWithMarker
        location={mapLocation}
        center={{ lat: 48.8566, lng: 2.3522 }}
        height="350px"
      />
    </div>
    </GoogleMapsLoader>
  )
} 