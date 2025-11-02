'use client'

import { useEffect } from 'react'
import { authClient } from '@/lib/auth-client'

/**
 * AuthStateManager - Composant pour gérer l'état d'authentification
 * Note: Better-Auth gère automatiquement les cookies de session,
 * ce composant est conservé pour compatibilité mais peut être supprimé progressivement
 */
export default function AuthStateManager() {
  const { data: session } = authClient.useSession()
  const isLoggedIn = !!session

  useEffect(() => {
    // Better-Auth gère automatiquement les cookies de session
    // On peut utiliser ce hook pour d'autres effets si nécessaire
    if (isLoggedIn && session?.user) {
      // Logique optionnelle pour stocker des données locales si nécessaire
      // Exemple: localStorage.setItem('userId', session.user.id)
    } else if (!isLoggedIn) {
      // Nettoyer les données locales si nécessaire
      // Exemple: localStorage.removeItem('userId')
    }
  }, [isLoggedIn, session])

  return null
} 