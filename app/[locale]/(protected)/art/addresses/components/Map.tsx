'use client'

import { useEffect, useRef, useState } from "react"

import { GoogleMap, useJsApiLoader } from '@react-google-maps/api'
import { Library } from "@googlemaps/js-api-loader"

// Déplacer la constante en dehors du composant pour éviter la recréation à chaque rendu
const GOOGLE_MAPS_LIBRARIES: Library[] = ['core', 'maps', 'places', 'marker']

export type LatLong = {
    lat: number,
    long: number
}

export default function Map(latLong: LatLong) {

    const [map, setMap] = useState<google.maps.Map | null>(null)
    const [autoComplete, setAutoComplete] = useState<google.maps.places.Autocomplete | null>(null)

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
        libraries: GOOGLE_MAPS_LIBRARIES,
    })

    const mapRef = useRef<HTMLDivElement>(null)
    const placeAutocompleteRef = useRef<HTMLInputElement>(null)


    useEffect(() => {
        if (isLoaded) {
            const mapOptions = {
                center: { lat: latLong.lat, lng: latLong.long },
                zoom: 17,
                mapId: 'MY_MAP_IRA',
            }

            //setup the map
            const gMap = new google.maps.Map(mapRef.current as HTMLDivElement, mapOptions)
            setMap(gMap)

            //Setup autocomplete
            const gAutoComplete = new google.maps.places.Autocomplete(placeAutocompleteRef.current as HTMLInputElement, {
                fields: ['address_components', 'geometry'],
                types: ['address'],
            })
            setAutoComplete(gAutoComplete)
        }
            
        
    }, [isLoaded])

  return (
    <div className="flex flex-col gap-4">
        <div className="form-group">
            <label htmlFor="address" className="form-label">Address</label>
            <input
                ref={placeAutocompleteRef}
                id="address"
                name="address"
                type="text"
                className="form-input"
                placeholder="Rechercher une adresse..."
            />
        </div>
        {isLoaded ? (
            <div style={{ height: '400px'}} ref={mapRef} className="w-full h-full">
               
            </div>
        ) : (
            <div>Loading...</div>
        )}
    </div>
  )
}