'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'

interface GoogleMapsLoaderProps {
  children: React.ReactNode
  onLoad?: () => void
}

export default function GoogleMapsLoader({ children, onLoad }: GoogleMapsLoaderProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)

  const handleLoad = () => {
    // Vérifier que Google Maps est bien disponible
    if (typeof google !== 'undefined' && google.maps) {
      setIsLoaded(true)
      onLoad?.()
    } else {
      setHasError(true)
    }
  }

  const handleError = () => {
    console.error('Erreur lors du chargement de Google Maps')
    setHasError(true)
  }

  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="p-4 border rounded-lg bg-red-50 border-red-200">
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          Configuration Google Maps manquante
        </h3>
        <p className="text-red-700">
          La clé API Google Maps n'est pas configurée. 
          Veuillez ajouter NEXT_PUBLIC_GOOGLE_MAPS_API_KEY dans votre fichier .env.local
        </p>
      </div>
    )
  }

  return (
    <>
      <Script
        src={`https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places,marker&v=weekly`}
        strategy="afterInteractive"
        onLoad={handleLoad}
        onError={handleError}
      />
      
      {hasError && (
        <div className="p-4 border rounded-lg bg-red-50 border-red-200 mb-4">
          <h3 className="text-lg font-semibold text-red-800 mb-2">
            Erreur de chargement Google Maps
          </h3>
          <p className="text-red-700">
            Impossible de charger l'API Google Maps. Vérifiez votre clé API et votre connexion internet.
          </p>
        </div>
      )}
      
      {isLoaded ? (
        children
      ) : (
        <div className="p-4 border rounded-lg bg-blue-50 border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <div>
              <h3 className="text-lg font-semibold text-blue-800">
                Chargement de Google Maps...
              </h3>
              <p className="text-blue-700 text-sm">
                Préparation des fonctionnalités d'adresse et de géolocalisation
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
} 