import { useEffect, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'

/// <reference types="google.maps" />

export interface PlaceDetails {
    streetAddress: string
    postalCode: string
    city: string
    country: string
    countryCode: string
}

export interface UseGooglePlacesReturn {
    isLoaded: boolean
    error: string | null
    initializeAutocomplete: (
        inputElement: HTMLInputElement,
        onPlaceSelect: (details: PlaceDetails) => void
    ) => google.maps.places.Autocomplete | null
}

export const useGooglePlaces = (): UseGooglePlacesReturn => {
    const [isLoaded, setIsLoaded] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const initGooglePlaces = async () => {
            try {
                const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

                if (!apiKey) {
                    setError('Clé API Google Maps manquante')
                    return
                }

                const loader = new Loader({
                    apiKey,
                    version: 'weekly',
                    libraries: ['places']
                })

                await loader.load()
                setIsLoaded(true)
            } catch (error) {
                console.error('Erreur lors du chargement de Google Places API:', error)
                setError('Erreur lors du chargement de l\'autocomplétion')
            }
        }

        initGooglePlaces()
    }, [])

    const initializeAutocomplete = (
        inputElement: HTMLInputElement,
        onPlaceSelect: (details: PlaceDetails) => void
    ): google.maps.places.Autocomplete | null => {
        if (!isLoaded || !inputElement) return null

        const autocomplete = new google.maps.places.Autocomplete(inputElement, {
            types: ['address'],
            componentRestrictions: {
                country: ['fr', 'be', 'ch', 'ca', 'us', 'gb', 'de', 'es', 'it', 'lu', 'mc']
            },
            fields: ['address_components', 'formatted_address', 'geometry']
        })

        const listener = autocomplete.addListener('place_changed', () => {
            const place = autocomplete.getPlace()

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
                if (!locality && types.includes('sublocality_level_1')) {
                    locality = component.long_name
                }
            })

            const streetAddress = `${streetNumber} ${route}`.trim()

            // Appeler le callback avec les détails
            onPlaceSelect({
                streetAddress,
                postalCode,
                city: locality,
                country,
                countryCode: countryCode.toUpperCase()
            })
        })

        return autocomplete
    }

    return {
        isLoaded,
        error,
        initializeAutocomplete
    }
} 