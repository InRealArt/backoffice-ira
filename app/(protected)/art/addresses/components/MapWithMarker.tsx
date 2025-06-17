'use client'

import { useEffect, useRef, useState } from 'react'

export type MapLocation = {
  lat: number
  lng: number
  address?: string
}

interface MapWithMarkerProps {
  location?: MapLocation
  center?: { lat: number, lng: number }
  mapId?: string
  className?: string
  height?: string
}

export default function MapWithMarker({
  location,
  center = { lat: 48.8566, lng: 2.3522 }, // Paris par défaut
  mapId = 'MY_MAP_IRA',
  className = '',
  height = '400px'
}: MapWithMarkerProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [map, setMap] = useState<google.maps.Map | null>(null)
  const [marker, setMarker] = useState<google.maps.marker.AdvancedMarkerElement | null>(null)
  const [infoWindow, setInfoWindow] = useState<google.maps.InfoWindow | null>(null)

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

    const initMap = async () => {
      try {
        // Attendre que Google Maps soit disponible
        await waitForGoogleMaps()

        // Charger les librairies nécessaires
        // @ts-ignore
        const [{ Map }, { AdvancedMarkerElement }] = await Promise.all([
          // @ts-ignore
          google.maps.importLibrary('maps'),
          // @ts-ignore
          google.maps.importLibrary('marker')
        ])

        // Initialiser la carte
        // @ts-ignore
        const gMap = new Map(mapRef.current as HTMLElement, {
          center: location || center,
          zoom: location ? 17 : 13,
          mapId,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: true,
          zoomControl: true
        })

        // Créer le marqueur et la fenêtre d'info
        // @ts-ignore
        const gMarker = new AdvancedMarkerElement({
          map: gMap,
          position: location || null,
          title: location?.address || 'Localisation'
        })

        const gInfoWindow = new google.maps.InfoWindow({})

        setMap(gMap)
        setMarker(gMarker)
        setInfoWindow(gInfoWindow)
        setIsLoaded(true)

      } catch (error) {
        console.error('Erreur lors de l\'initialisation de la carte:', error)
      }
    }

    // Initialiser la carte
    initMap()
  }, [center, mapId])

  // Mettre à jour le marker quand la location change
  useEffect(() => {
    if (!map || !marker || !infoWindow) return

    if (location) {
      // Mettre à jour la position du marker
      marker.position = { lat: location.lat, lng: location.lng }
      
      // Centrer la carte sur la nouvelle position
      map.setCenter({ lat: location.lat, lng: location.lng })
      map.setZoom(17)

      // Créer le contenu de la fenêtre d'info
      if (location.address) {
        const content = `
          <div class="p-2">
            <h4 class="font-semibold text-gray-800 mb-1">📍 Localisation</h4>
            <p class="text-sm text-gray-600">${location.address}</p>
          </div>
        `

        infoWindow.setContent(content)
        infoWindow.setPosition({ lat: location.lat, lng: location.lng })
        infoWindow.open({
          map,
          anchor: marker,
          shouldFocus: false
        })
      }
    } else {
      // Masquer le marker s'il n'y a pas de location
      marker.position = null
      infoWindow.close()
    }
  }, [location, map, marker, infoWindow])

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {location && (
        <div className="text-sm text-gray-600 bg-blue-50 p-2 rounded border">
          <span className="font-medium">📍 Adresse validée :</span> {location.address}
        </div>
      )}
      
      <div className="relative">
        {!isLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg z-10">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Chargement de la carte...</p>
            </div>
          </div>
        )}
        
        <div 
          ref={mapRef}
          className="w-full rounded-lg border"
          style={{ height }}
        />
      </div>
      
      {!location && (
        <p className="text-sm text-gray-500 text-center">
          La carte affichera un marker une fois que vous aurez validé une adresse
        </p>
      )}
    </div>
  )
} 