'use client'

import { useEffect, useRef, useState } from 'react'

export type AddressComponents = {
  streetAddress: string
  postalCode: string
  city: string
  country: string
  countryCode: string
}

interface SimpleAutocompleteProps {
  value: string
  onAddressChange: (address: string) => void
  onPlaceSelect: (components: AddressComponents) => void
  placeholder?: string
  className?: string
  required?: boolean
}

export default function SimpleAutocomplete({
  value,
  onAddressChange,
  onPlaceSelect,
  placeholder = 'Commencez à saisir votre adresse...',
  className = 'form-input',
  required = false
}: SimpleAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null)

  useEffect(() => {
    const waitForGoogleMaps = () => {
      return new Promise((resolve) => {
        if (typeof google !== 'undefined' && google.maps) {
          resolve(google)
          return
        }
        
        // Attendre que l'API soit chargée
        const checkGoogle = setInterval(() => {
          if (typeof google !== 'undefined' && google.maps) {
            clearInterval(checkGoogle)
            resolve(google)
          }
        }, 100)
        
        // Timeout après 10 secondes
        setTimeout(() => {
          clearInterval(checkGoogle)
          console.error('Timeout: API Google Maps non disponible après 10 secondes')
        }, 10000)
      })
    }

    const initAutocomplete = async () => {
      try {
        // Attendre que Google Maps soit disponible
        await waitForGoogleMaps()

        // Charger la librairie places
        // @ts-ignore
        await google.maps.importLibrary('places')

        if (!inputRef.current) return

        // Créer l'autocomplétion
        const gAutocomplete = new google.maps.places.Autocomplete(inputRef.current, {
          types: ['address'],
          componentRestrictions: { 
            country: ['fr', 'be', 'ch', 'ca', 'us', 'gb', 'de', 'es', 'it'] 
          },
          fields: ['address_components', 'formatted_address', 'geometry']
        })

        // Écouter les sélections de lieu
        gAutocomplete.addListener('place_changed', () => {
          const place = gAutocomplete.getPlace()
          
          if (!place || !place.address_components) {
            return
          }

          // Parser les composants d'adresse
          const addressComponents = place.address_components
          let streetNumber = ''
          let route = ''
          let locality = ''
          let postalCode = ''
          let country = ''
          let countryCode = ''

          addressComponents.forEach((component: google.maps.GeocoderAddressComponent) => {
            const types = component.types
            
            if (types.includes('street_number')) {
              streetNumber = component.long_name
            }
            if (types.includes('route')) {
              route = component.long_name
            }
            if (types.includes('locality')) {
              locality = component.long_name
            }
            if (types.includes('postal_code')) {
              postalCode = component.long_name
            }
            if (types.includes('country')) {
              country = component.long_name
              countryCode = component.short_name
            }
            // Fallback pour les villes
            if (!locality && types.includes('administrative_area_level_2')) {
              locality = component.long_name
            }
            if (!locality && types.includes('administrative_area_level_1')) {
              locality = component.long_name
            }
          })

          const streetAddress = `${streetNumber} ${route}`.trim()
          const formattedAddress = place.formatted_address || streetAddress
          
          // Mettre à jour l'input avec l'adresse formatée
          onAddressChange(formattedAddress)
          
          // Appeler le callback avec les composants d'adresse
          onPlaceSelect({
            streetAddress,
            postalCode,
            city: locality,
            country,
            countryCode: countryCode.toUpperCase()
          })
        })

        setAutocomplete(gAutocomplete)
        setIsLoaded(true)

      } catch (error) {
        console.error('Erreur lors de l\'initialisation de l\'autocomplétion:', error)
      }
    }

    initAutocomplete()
  }, [onAddressChange, onPlaceSelect])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onAddressChange(e.target.value)
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        placeholder={isLoaded ? placeholder : 'Chargement de l\'autocomplétion...'}
        className={className}
        required={required}
        disabled={!isLoaded}
      />
      {!isLoaded && (
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
        </div>
      )}
    </div>
  )
} 