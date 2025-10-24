'use client'

import { useState, useEffect, useCallback } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useDynamicContext } from '@dynamic-labs/sdk-react-core'
import { checkAuthorizedUser, checkIsAdmin } from '@/lib/actions/auth-actions'

export function useSideMenuLogic() {
  // Récupérer le pathway pour déterminer l'élément actif
  const pathname = usePathname()
  const router = useRouter()

  // Utiliser le contexte Dynamic pour l'authentification
  const dynamicContext = useDynamicContext()

  // État des sous-menus
  const [showBackofficeAdminSubmenu, setShowBackofficeAdminSubmenu] = useState(false)
  const [showBlockchainSubmenu, setShowBlockchainSubmenu] = useState(false)
  const [showMarketplaceSubmenu, setShowMarketplaceSubmenu] = useState(false)
  const [showDataAdministrationSubmenu, setShowDataAdministrationSubmenu] = useState(false)
  const [showLandingSubmenu, setShowLandingSubmenu] = useState(false)
  const [showToolsSubmenu, setShowToolsSubmenu] = useState(false)

  // État pour le menu plié/déplié
  const [isMenuCollapsed, setIsMenuCollapsed] = useState(false)

  // État de l'élément actif
  const [activeItem, setActiveItem] = useState('')

  // Si l'utilisateur est connecté - définir à true par défaut en développement
  const [isLoggedIn, setIsLoggedIn] = useState(true)

  // Si l'utilisateur est un admin ou a accès à une collection - définir par défaut à false
  const [isAdmin, setIsAdmin] = useState(false)
  const [canAccessCollection, setCanAccessCollection] = useState(true)

  // État de chargement pour les vérifications d'authentification
  const [isLoading, setIsLoading] = useState(true)

  // Fermer tous les sous-menus sauf celui spécifié
  const closeAllSubmenusExcept = useCallback((menuToKeepOpen: string | null) => {
    if (menuToKeepOpen !== 'backofficeAdmin') setShowBackofficeAdminSubmenu(false)
    if (menuToKeepOpen !== 'blockchain') setShowBlockchainSubmenu(false)
    if (menuToKeepOpen !== 'marketplace') setShowMarketplaceSubmenu(false)
    if (menuToKeepOpen !== 'dataAdministration') setShowDataAdministrationSubmenu(false)
    if (menuToKeepOpen !== 'landing') setShowLandingSubmenu(false)
    if (menuToKeepOpen !== 'tools') setShowToolsSubmenu(false)
  }, [])

  // Fonction pour basculer l'état du sous-menu
  const toggleBackofficeAdminSubmenu = useCallback(() => {
    setShowBackofficeAdminSubmenu(prev => {
      const newState = !prev
      if (newState) closeAllSubmenusExcept('backofficeAdmin')
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

  // Fonction pour basculer l'état du sous-menu Landing
  const toggleLandingSubmenu = useCallback(() => {
    setShowLandingSubmenu(prev => {
      const newState = !prev
      if (newState) closeAllSubmenusExcept('landing')
      return newState
    })
  }, [closeAllSubmenusExcept])

  // Fonction pour basculer l'état du sous-menu Tools
  const toggleToolsSubmenu = useCallback(() => {
    setShowToolsSubmenu(prev => {
      const newState = !prev
      if (newState) closeAllSubmenusExcept('tools')
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
      } else if (pathname.includes('/art/collection')) {
        setActiveItem('collection')
      } else if (pathname.includes('/art/createArtwork')) {
        setActiveItem('createArtwork')
      } else if (pathname.includes('/admin-art/createArtwork')) {
        setActiveItem('adminMarketplace')
        setShowMarketplaceSubmenu(true)
      } else if (pathname.includes('/admin-art/collection') || pathname.includes('/admin-art/editArtwork')) {
        setActiveItem('adminMarketplace')
        setShowMarketplaceSubmenu(true)
      } else if (pathname.includes('/shopify')) {
        setActiveItem('adminBackofficeAdmin')
        setShowBackofficeAdminSubmenu(true)
      } else if (pathname.includes('/blockchain')) {
        setActiveItem('adminBlockchain')
        setShowBlockchainSubmenu(true)
      } else if (pathname.includes('/marketplace')) {
        setActiveItem('adminMarketplace')
        setShowMarketplaceSubmenu(true)
      } else if (pathname.includes('/dataAdministration')) {
        setActiveItem('adminDataAdministration')
        setShowDataAdministrationSubmenu(true)
      } else if (pathname.includes('/landing')) {
        setActiveItem('adminLanding')
        setShowLandingSubmenu(true)
      } else if (pathname.includes('/tools')) {
        setActiveItem('adminTools')
        setShowToolsSubmenu(true)
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
      setIsLoading(true)
      const { user } = dynamicContext;

      if (user?.email) {
        setIsLoggedIn(true);

        try {
          // Vérifier le rôle de l'utilisateur via Server Action
          const result = await checkAuthorizedUser(user.email);

          if (result.authorized) {
            // Vérifier si l'utilisateur a un rôle administrateur via Server Action
            const isAdmin = await checkIsAdmin(user.email);
            setIsAdmin(isAdmin);

            // Tous les utilisateurs autorisés peuvent accéder à leur collection
            setCanAccessCollection(result.authorized);
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

      setIsLoading(false)
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
    isLoading,
    showBackofficeAdminSubmenu,
    showBlockchainSubmenu,
    showMarketplaceSubmenu,
    showDataAdministrationSubmenu,
    showLandingSubmenu,
    showToolsSubmenu,

    isMenuCollapsed,
    handleNavigation,
    toggleBackofficeAdminSubmenu,
    toggleBlockchainSubmenu,
    toggleMarketplaceSubmenu,
    toggleDataAdministrationSubmenu,
    toggleLandingSubmenu,
    toggleToolsSubmenu,

    toggleMenuCollapse
  }
}