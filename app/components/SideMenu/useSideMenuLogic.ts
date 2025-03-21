'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'

export function useSideMenuLogic() {
  // Récupérer le pathway pour déterminer l'élément actif
  const pathname = usePathname()
  const router = useRouter()

  // Utiliser le contexte Dynamic pour l'authentification
  const dynamicContext = useDynamicContext()

  // État des sous-menus
  const [showShopifySubmenu, setShowShopifySubmenu] = useState(false)
  const [showBlockchainSubmenu, setShowBlockchainSubmenu] = useState(false)
  const [showMarketplaceSubmenu, setShowMarketplaceSubmenu] = useState(false)

  // État de l'élément actif
  const [activeItem, setActiveItem] = useState('')

  // Si l'utilisateur est connecté - définir à true par défaut en développement
  const [isLoggedIn, setIsLoggedIn] = useState(true)

  // Si l'utilisateur est un admin ou a accès à une collection - définir à true par défaut en développement
  const [isAdmin, setIsAdmin] = useState(true)
  const [canAccessCollection, setCanAccessCollection] = useState(true)

  // Fermer tous les sous-menus sauf celui spécifié
  const closeAllSubmenusExcept = useCallback((menuToKeepOpen: string | null) => {
    if (menuToKeepOpen !== 'shopify') setShowShopifySubmenu(false)
    if (menuToKeepOpen !== 'blockchain') setShowBlockchainSubmenu(false)
    if (menuToKeepOpen !== 'marketplace') setShowMarketplaceSubmenu(false)
  }, [])

  // Fonction pour basculer l'état du sous-menu Shopify
  const toggleShopifySubmenu = useCallback(() => {
    setShowShopifySubmenu(prev => {
      const newState = !prev
      if (newState) closeAllSubmenusExcept('shopify')
      return newState
    })
  }, [closeAllSubmenusExcept])

  // Fonction pour basculer l'état du sous-menu Blockchain
  const toggleBlockchainSubmenu = useCallback(() => {
    setShowBlockchainSubmenu(prev => {
      const newState = !prev
      if (newState) closeAllSubmenusExcept('blockchain')
      return newState
    })
  }, [closeAllSubmenusExcept])

  // Fonction pour basculer l'état du sous-menu Marketplace
  const toggleMarketplaceSubmenu = useCallback(() => {
    setShowMarketplaceSubmenu(prev => {
      const newState = !prev
      if (newState) closeAllSubmenusExcept('marketplace')
      return newState
    })
  }, [closeAllSubmenusExcept])

  // Fonction pour la navigation - Utiliser useRouter pour une navigation côté client
  const handleNavigation = useCallback((path: string, item: string) => {
    // Utiliser le router Next.js pour une navigation sans rechargement de page
    router.push(path)
    setActiveItem(item)
    closeAllSubmenusExcept(null)
  }, [router, closeAllSubmenusExcept])

  // Déterminer l'élément actif en fonction du chemin
  useEffect(() => {
    if (pathname) {
      if (pathname.includes('/dashboard')) {
        setActiveItem('dashboard')
      } else if (pathname.includes('/shopify/collection')) {
        setActiveItem('collection')
      } else if (pathname.includes('/shopify/createArtwork')) {
        setActiveItem('createArtwork')
      } else if (pathname.includes('/shopify')) {
        setActiveItem('adminShopify')
        setShowShopifySubmenu(true)
      } else if (pathname.includes('/blockchain')) {
        setActiveItem('adminBlockchain')
        setShowBlockchainSubmenu(true)
      } else if (pathname.includes('/marketplace')) {
        setActiveItem('adminMarketplace')
        setShowMarketplaceSubmenu(true)
      }
    }
  }, [pathname])

  // Vérification d'authentification simplifiée - décommenter en production
  /* useEffect(() => {
    const checkAuth = () => {
      // Exemple simplifié - à remplacer par votre propre logique d'authentification
      const userData = localStorage.getItem('user')
      
      if (userData) {
        setIsLoggedIn(true)
        
        try {
          const user = JSON.parse(userData)
          setIsAdmin(user.role === 'admin')
          setCanAccessCollection(user.hasCollection || user.role === 'artist')
        } catch (e) {
          console.error('Erreur lors de la lecture des données utilisateur:', e)
        }
      } else {
        setIsLoggedIn(false)
        setIsAdmin(false)
        setCanAccessCollection(false)
      }
    }
    
    checkAuth()
    
    window.addEventListener('storage', checkAuth)
    document.addEventListener('dynamicAuthStateChanged', checkAuth)
    
    return () => {
      window.removeEventListener('storage', checkAuth)
      document.removeEventListener('dynamicAuthStateChanged', checkAuth)
    }
  }, []) */

  // Effet pour fermer les sous-menus sur clic en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Vérifier si le clic est en dehors du menu latéral
      const sideMenu = document.querySelector('.side-menu')
      if (sideMenu && !sideMenu.contains(event.target as Node)) {
        closeAllSubmenusExcept(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [closeAllSubmenusExcept])

  return {
    isLoggedIn,
    activeItem,
    canAccessCollection,
    isAdmin,
    showShopifySubmenu,
    showBlockchainSubmenu,
    showMarketplaceSubmenu,
    handleNavigation,
    toggleShopifySubmenu,
    toggleBlockchainSubmenu,
    toggleMarketplaceSubmenu
  }
}