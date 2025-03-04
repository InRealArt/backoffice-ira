'use client'

import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useIsLoggedIn, useDynamicContext } from '@dynamic-labs/sdk-react-core'

export function useSideMenuLogic() {
  const isLoggedIn = useIsLoggedIn()
  const { primaryWallet } = useDynamicContext()
  const [activeItem, setActiveItem] = useState('dashboard')
  const [canAccessCollection, setCanAccessCollection] = useState(false)
  const [isAdmin, setIsAdmin] = useState(false)
  const [showShopifySubmenu, setShowShopifySubmenu] = useState(false)
  const [showBlockchainSubmenu, setShowBlockchainSubmenu] = useState<boolean>(false)
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

          // Vérifier si l'utilisateur est admin
          const adminResponse = await fetch('/api/shopify/isAdmin', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              walletAddress: primaryWallet.address
            }),
          })
          console.log("useSideMenuLogic - isAdmin - adminResponse.ok : ", adminResponse.ok)
          if (adminResponse.ok) {
            const adminResult = await adminResponse.json()
            setIsAdmin(adminResult.isAdmin)
          }

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
  const toggleShopifySubmenu = (e: React.MouseEvent) => {
    e.stopPropagation()
    setShowShopifySubmenu(!showShopifySubmenu)
  }

  const toggleBlockchainSubmenu = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setShowBlockchainSubmenu(prev => !prev)
  }


  return {
    isLoggedIn,
    activeItem,
    canAccessCollection,
    isAdmin,
    showShopifySubmenu,
    showBlockchainSubmenu,
    handleNavigation,
    toggleShopifySubmenu,
    toggleBlockchainSubmenu
  }
}