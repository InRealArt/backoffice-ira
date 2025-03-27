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
  const [showDataAdministrationSubmenu, setShowDataAdministrationSubmenu] = useState(false)
  // État pour le menu plié/déplié
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false)

  // État de l'élément actif
  const [activeItem, setActiveItem] = useState('')

  // Si l'utilisateur est connecté - définir à true par défaut en développement
  const [isLoggedIn, setIsLoggedIn] = useState(true)

  // Si l'utilisateur est un admin ou a accès à une collection - définir par défaut à false
  const [isAdmin, setIsAdmin] = useState(false)
  const [canAccessCollection, setCanAccessCollection] = useState(true)

  // Fermer tous les sous-menus sauf celui spécifié
  const closeAllSubmenusExcept = useCallback((menuToKeepOpen: string | null) => {
    if (menuToKeepOpen !== 'shopify') setShowShopifySubmenu(false)
    if (menuToKeepOpen !== 'blockchain') setShowBlockchainSubmenu(false)
    if (menuToKeepOpen !== 'marketplace') setShowMarketplaceSubmenu(false)
    if (menuToKeepOpen !== 'dataAdministration') setShowDataAdministrationSubmenu(false)
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

  // Fonction pour basculer l'état du sous-menu Data Administration
  const toggleDataAdministrationSubmenu = useCallback(() => {
    setShowDataAdministrationSubmenu(prev => {
      const newState = !prev
      if (newState) closeAllSubmenusExcept('dataAdministration')
      return newState
    })
  }, [closeAllSubmenusExcept])

  // Fonction pour plier/déplier le menu latéral
  const toggleMenuCollapse = useCallback(() => {
    setIsMenuCollapsed(prev => !prev)
    // Stocker la préférence de l'utilisateur dans le localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('sideMenuCollapsed', (!isMenuCollapsed).toString())
    }
  }, [isMenuCollapsed])

  // Fonction pour la navigation - Utiliser useRouter pour une navigation côté client
  const handleNavigation = useCallback((path: string, item: string) => {
    // Utiliser le router Next.js pour une navigation sans rechargement de page
    router.push(path)
    setActiveItem(item)
    closeAllSubmenusExcept(null)
    // Si le menu est plié sur mobile, le replier après la navigation
    if (window.innerWidth <= 768 && !isMenuCollapsed) {
      toggleMenuCollapse()
    }
  }, [router, closeAllSubmenusExcept, isMenuCollapsed, toggleMenuCollapse])

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
      } else if (pathname.includes('/dataAdministration')) {
        setActiveItem('adminDataAdministration')
        setShowDataAdministrationSubmenu(true)
      }
    }
  }, [pathname])

  // Récupérer la préférence de menu plié/déplié depuis localStorage au chargement
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedMenuState = localStorage.getItem('sideMenuCollapsed')
      if (savedMenuState !== null) {
        setIsMenuCollapsed(savedMenuState === 'true')
      }
    }
  }, [])

  // Vérification de l'authentification et des rôles utilisateur
  useEffect(() => {
    const checkUserRole = async () => {
      const { user } = dynamicContext;

      if (user?.email) {
        setIsLoggedIn(true);

        try {
          // Vérifier le rôle de l'utilisateur via l'API
          const response = await fetch('/api/auth/checkAuthorizedUser', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: user.email
            }),
          });

          if (response.ok) {
            const data = await response.json();

            // Vérifier si l'utilisateur a un rôle administrateur
            // Appel direct à l'API pour vérifier le rôle admin
            const adminCheckResponse = await fetch('/api/auth/checkAdminRole', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: user.email,
                walletAddress: dynamicContext.primaryWallet?.address || null
              }),
            });

            if (adminCheckResponse.ok) {
              const adminData = await adminCheckResponse.json();
              setIsAdmin(adminData.isAdmin);
            } else {
              setIsAdmin(false);
            }

            // Tous les utilisateurs autorisés peuvent accéder à leur collection
            setCanAccessCollection(data.authorized);
          } else {
            setIsAdmin(false);
            setCanAccessCollection(false);
          }
        } catch (error) {
          console.error('Erreur lors de la vérification du rôle:', error);
          setIsAdmin(false);
          setCanAccessCollection(false);
        }
      } else {
        setIsLoggedIn(false);
        setIsAdmin(false);
        setCanAccessCollection(false);
      }
    };

    checkUserRole();
  }, [dynamicContext.user, dynamicContext.primaryWallet]);

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
    isMenuCollapsed,
    handleNavigation,
    toggleShopifySubmenu,
    toggleBlockchainSubmenu,
    toggleMarketplaceSubmenu,
    toggleMenuCollapse,
    showDataAdministrationSubmenu,
    toggleDataAdministrationSubmenu
  }
}