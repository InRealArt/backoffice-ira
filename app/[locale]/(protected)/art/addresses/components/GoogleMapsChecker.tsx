'use client'

import { useEffect, useState } from 'react'

type ApiStatus = 'loading' | 'success' | 'error' | 'missing-key'

export default function GoogleMapsChecker() {
  const [status, setStatus] = useState<ApiStatus>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const checkGoogleMaps = async () => {
      // Vérifier la clé API
      const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
      if (!apiKey || apiKey === 'your_google_maps_api_key_here') {
        setStatus('missing-key')
        setErrorMessage('Clé API Google Maps manquante ou non configurée')
        return
      }

      // Attendre que Google Maps soit chargé
      let attempts = 0
      const maxAttempts = 50 // 5 secondes

      const checkGoogle = setInterval(() => {
        attempts++

        if (typeof google !== 'undefined' && google.maps) {
          clearInterval(checkGoogle)
          setStatus('success')
          return
        }

        if (attempts >= maxAttempts) {
          clearInterval(checkGoogle)
          setStatus('error')
          setErrorMessage(`API Google Maps non chargée après ${maxAttempts * 100}ms. Vérifiez votre clé API et votre connexion internet.`)
        }
      }, 100)
    }

    checkGoogleMaps()
  }, [])

  const getStatusColor = () => {
    switch (status) {
      case 'loading': return 'text-yellow-600'
      case 'success': return 'text-green-600'
      case 'error': return 'text-red-600'
      case 'missing-key': return 'text-orange-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusMessage = () => {
    switch (status) {
      case 'loading': return 'Chargement de l\'API Google Maps...'
      case 'success': return '✅ API Google Maps chargée avec succès'
      case 'error': return `❌ ${errorMessage}`
      case 'missing-key': return `⚠️ ${errorMessage}`
      default: return 'Statut inconnu'
    }
  }

  const getInstructions = () => {
    if (status === 'missing-key') {
      return (
        <div className="mt-2 p-3 bg-orange-50 border border-orange-200 rounded">
          <h4 className="font-semibold text-orange-800">Configuration requise :</h4>
          <ol className="list-decimal list-inside text-sm text-orange-700 mt-1">
            <li>Créez un fichier <code>.env.local</code> à la racine du projet</li>
            <li>Ajoutez votre clé API : <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=votre_cle_ici</code></li>
            <li>Obtenez votre clé sur <a href="https://console.cloud.google.com/" target="_blank" className="underline">Google Cloud Console</a></li>
            <li>Activez les APIs : Places API (New) et Maps JavaScript API</li>
            <li>Redémarrez votre serveur de développement</li>
          </ol>
        </div>
      )
    }

    if (status === 'error') {
      return (
        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded">
          <h4 className="font-semibold text-red-800">Solutions possibles :</h4>
          <ul className="list-disc list-inside text-sm text-red-700 mt-1">
            <li>Vérifiez que votre clé API est valide</li>
            <li>Vérifiez que les APIs Places et Maps sont activées</li>
            <li>Vérifiez votre connexion internet</li>
            <li>Ouvrez les DevTools pour voir d'autres erreurs</li>
          </ul>
        </div>
      )
    }

    if (status === 'success') {
      return (
        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded">
          <p className="text-sm text-green-700">
            Parfait ! Vous pouvez maintenant utiliser les composants d'autocomplétion d'adresse.
          </p>
        </div>
      )
    }

    return null
  }

  return (
    <div className="p-4 border rounded-lg bg-white shadow-sm">
      <h3 className="text-lg font-semibold mb-2">Diagnostic Google Maps API</h3>
      <p className={`${getStatusColor()} font-medium mb-2`}>
        {getStatusMessage()}
      </p>
      
      <div className="text-sm text-gray-600 mb-2">
        <p><strong>Clé API :</strong> {process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ? '✅ Configurée' : '❌ Manquante'}</p>
        <p><strong>Script chargé :</strong> {typeof google !== 'undefined' ? '✅ Oui' : '❌ Non'}</p>
        <p><strong>API disponible :</strong> {typeof google !== 'undefined' && google.maps ? '✅ Oui' : '❌ Non'}</p>
      </div>

      {getInstructions()}
    </div>
  )
} 