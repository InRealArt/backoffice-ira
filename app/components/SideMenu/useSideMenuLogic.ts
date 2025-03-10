'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useIsLoggedIn, useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { useIsAdmin } from '@/app/hooks/useIsAdmin'

export function useSideMenuLogic() {
  const isLoggedIn = useIsLoggedIn()
  const { primaryWallet } = useDynamicContext()
  const [activeItem, setActiveItem] = useState('dashboard')
  const [canAccessCollection, setCanAccessCollection] = useState(false)
  const { isAdmin, isLoading } = useIsAdmin()
  const [showShopifySubmenu, setShowShopifySubmenu] = useState(false)
  const [showBlockchainSubmenu, setShowBlockchainSubmenu] = useState<boolean>(false)
  const [showMarketplaceSubmenu, setShowMarketplaceSubmenu] = useState<boolean>(false)
  const router = useRouter()
  const pathname = usePathname()

  // Vérifier les accès utilisateur
  useEffect(() => {
    const checkUserAccess = async () => {
      if (isLoggedIn && primaryWallet) {
        try {
          const response = await fetch('/api/shopify/isArtistAndGranted', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              walletAddress: primaryWallet.address
            }),
          })

          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || `Erreur ${response.status}`)
          }

          const result = await response.json()
          setCanAccessCollection(result.hasAccess === true)

        } catch (err) {
          console.error('Erreur lors de la vérification des accès:', err)
          setCanAccessCollection(false)
        }
      }
    }

    checkUserAccess()
  }, [isLoggedIn, primaryWallet])

  // Mettre à jour l'élément actif en fonction du chemin
  useEffect(() => {
    if (pathname === '/dashboard') {
      setActiveItem('dashboard')
    } else if (pathname === '/shopify/collection') {
      setActiveItem('collection')
    } else if (pathname === '/shopify/createArtwork') {
      setActiveItem('createArtwork')
    } else if (pathname === '/notifications') {
      setActiveItem('notifications')
    } else if (pathname.startsWith('/admin/shopify')) {
      setActiveItem('adminShopify')
    }
  }, [pathname])

  // Fonction de navigation
  const handleNavigation = (route: string, menuItem: string) => {
    setActiveItem(menuItem)
    router.push(route)
  }

  // Toggle du sous-menu Shopify
  const toggleShopifySubmenu = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setShowShopifySubmenu(!showShopifySubmenu)
    if (showBlockchainSubmenu) setShowBlockchainSubmenu(false)
  }

  const toggleBlockchainSubmenu = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setShowBlockchainSubmenu(prev => !prev)
    if (showMarketplaceSubmenu) setShowMarketplaceSubmenu(false)
  }

  const toggleMarketplaceSubmenu = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setShowMarketplaceSubmenu(prev => !prev)
    if (showBlockchainSubmenu) setShowBlockchainSubmenu(false)
  }

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