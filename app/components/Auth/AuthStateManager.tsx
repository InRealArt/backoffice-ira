'use client'

import { useEffect } from 'react'
import { useIsLoggedIn, useDynamicContext } from '@dynamic-labs/sdk-react-core'
import Cookies from 'js-cookie'

export default function AuthStateManager() {
  const isLoggedIn = useIsLoggedIn()
  const { primaryWallet, user } = useDynamicContext()

  useEffect(() => {
    // Quand l'utilisateur se connecte
    if (isLoggedIn && primaryWallet) {
      // Stocker un cookie d'authentification
      Cookies.set('dynamic_auth_token', 'authenticated', {
        expires: 1, // Expire après 1 jour
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict'
      })
      
      // Stocker l'adresse du portefeuille dans le stockage local
      localStorage.setItem('walletAddress', primaryWallet.address)
      localStorage.setItem('userIsLoggedIn', 'true')
    }
    
    // Quand l'utilisateur se déconnecte
    if (isLoggedIn === false) {
      // Supprimer le cookie d'authentification
      Cookies.remove('dynamic_auth_token', { path: '/' })
      
      // Supprimer les données du stockage local
      localStorage.removeItem('walletAddress')
      localStorage.removeItem('userIsLoggedIn')
    }
  }, [isLoggedIn, primaryWallet, user])

  return null
} 