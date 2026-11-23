'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArtistAddress } from '@/src/generated/prisma/browser'
import { getCountries, Country } from '@/lib/utils'
import InputField from '@/app/components/Forms/InputField'
import styles from '@/app/components/Forms/forms.module.css'
import SimpleAutocomplete, { AddressComponents } from './SimpleAutocomplete'
import MapWithMarker, { MapLocation } from './MapWithMarker'
import GoogleMapsLoader from './GoogleMapsLoader'
import { FormActions, FormGrid, FormSection, formKit } from '@/app/components/Forms/FormKit/FormKit'
import { useGeocoding } from '@/hooks/useGeocoding'

// Type étendu pour inclure vatNumber qui n'est pas dans le modèle Prisma

interface AddressFormProps {
  address?: ArtistAddress
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
  const [isManualMode, setIsManualMode] = useState(false)
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
    countryCode: defaultCountryCode
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

  const handleManualModeToggle = () => {
    setIsManualMode(!isManualMode)
    // Si on passe en mode manuel, effacer les champs pour permettre la saisie manuelle
    if (!isManualMode) {
      setFormData({
        ...formData,
        postalCode: '',
        city: '',
        country: '',
        countryCode: 'FR'
      })
      // Effacer aussi la localisation de la carte
      setMapLocation(undefined)
    }
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
      <form onSubmit={handleSubmit} className={formKit.form}>
        <FormSection title="Contact">
          <InputField
            id="name"
            name="name"
            label="Nom pour l'adresse"
            value={formData.name}
            onChange={handleChange}
            placeholder="Ex: Adresse de facturation, Adresse du bureau, etc."
            required
          />

          <FormGrid>
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
          </FormGrid>
        </FormSection>

        <FormSection
          title="Adresse"
          help={
            isManualMode
              ? "Saisie manuelle : renseignez l'adresse vous-même si l'autocomplétion ne la trouve pas."
              : "Autocomplétion : commencez à taper pour voir les suggestions d'adresses."
          }
        >
          <div className={formKit.segmented} role="group" aria-label="Mode de saisie de l'adresse">
            <button
              type="button"
              aria-pressed={!isManualMode}
              onClick={() => isManualMode && handleManualModeToggle()}
            >
              Autocomplétion
            </button>
            <button
              type="button"
              aria-pressed={isManualMode}
              onClick={() => !isManualMode && handleManualModeToggle()}
            >
              Saisie manuelle
            </button>
          </div>

          {isManualMode ? (
            <InputField
              id="streetAddress"
              name="streetAddress"
              label="Adresse *"
              value={formData.streetAddress}
              onChange={handleChange}
              placeholder="Numéro, rue, avenue..."
              required
            />
          ) : (
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
          )}

          <FormGrid>
            <InputField
              id="postalCode"
              name="postalCode"
              label="Code postal *"
              value={formData.postalCode}
              onChange={handleChange}
              disabled={!isManualMode}
              required
            />

            <InputField
              id="city"
              name="city"
              label="Ville *"
              value={formData.city}
              onChange={handleChange}
              disabled={!isManualMode}
              required
            />
          </FormGrid>

          <div className="form-group">
            <label htmlFor="countryCode" className="form-label">Pays *</label>
            <select
              id="countryCode"
              name="countryCode"
              value={formData.countryCode}
              onChange={handleChange}
              className={`form-select ${!isManualMode ? styles['input-disabled'] : ''}`}
              disabled={!isManualMode}
              required
            >
              {countries.map(country => (
                <option key={country.code} value={country.code}>
                  {country.name}
                </option>
              ))}
            </select>
          </div>
        </FormSection>

        {/* Afficher la carte uniquement en mode autocomplétion */}
        {!isManualMode && (
          <FormSection title="Localisation">
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
                style={{ alignSelf: 'flex-start' }}
              >
                Localiser sur la carte
              </button>
            )}
            <MapWithMarker
              location={mapLocation}
              center={{ lat: 48.8566, lng: 2.3522 }}
              height="350px"
            />
          </FormSection>
        )}

        <FormActions>
          <button
            type="button"
            onClick={() => router.push('/art/addresses')}
            className="btn btn-secondary btn-medium"
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
        </FormActions>
      </form>
    </GoogleMapsLoader>
  )
} 