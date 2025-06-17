import { useState, useCallback } from 'react'

export type GeocodeResult = {
    lat: number
    lng: number
    formattedAddress: string
}

export function useGeocoding() {
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const geocodeAddress = useCallback(async (address: string): Promise<GeocodeResult | null> => {
        if (!address.trim()) {
            return null
        }

        setIsLoading(true)
        setError(null)

        try {
            // Attendre que Google Maps soit disponible
            if (typeof google === 'undefined' || !google.maps) {
                throw new Error('API Google Maps non disponible')
            }

            const geocoder = new google.maps.Geocoder()

            return new Promise((resolve, reject) => {
                geocoder.geocode({ address }, (results, status) => {
                    setIsLoading(false)

                    if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
                        const location = results[0].geometry.location
                        const result: GeocodeResult = {
                            lat: location.lat(),
                            lng: location.lng(),
                            formattedAddress: results[0].formatted_address
                        }
                        resolve(result)
                    } else {
                        const errorMessage = `Impossible de géocoder l'adresse: ${status}`
                        setError(errorMessage)
                        reject(new Error(errorMessage))
                    }
                })
            })

        } catch (err) {
            setIsLoading(false)
            const errorMessage = err instanceof Error ? err.message : 'Erreur de géocodage'
            setError(errorMessage)
            console.error('Erreur de géocodage:', err)
            return null
        }
    }, [])

    return {
        geocodeAddress,
        isLoading,
        error
    }
} 