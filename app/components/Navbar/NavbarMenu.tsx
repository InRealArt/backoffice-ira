'use client'

import { useState, useRef, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useSideMenuLogic } from '../SideMenu/useSideMenuLogic'
import { authClient } from '@/lib/auth-client'

export default function NavbarMenu() {
  const pathname = usePathname()
  const {
    isLoggedIn,
    activeItem,
    canAccessCollection,
    isAdmin,
    isLoading,
    isNavigating,
    navigatingItem,
    handleNavigation
  } = useSideMenuLogic()

  // État pour contrôler l'ouverture du menu dropdown mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const mobileMenuRef = useRef<HTMLDivElement>(null)
  const desktopMenuRef = useRef<HTMLDivElement>(null)

  const handleSignOut = async () => {
    await authClient.signOut()
  }

  // Fonction pour gérer la navigation avec fermeture du menu
  const handleMenuNavigation = async (path: string, item: string) => {
    // Fermer le menu mobile
    setIsMobileMenuOpen(false)
    // Désactiver le focus du dropdown pour le fermer
    if (mobileMenuRef.current) {
      const button = mobileMenuRef.current.querySelector('[tabIndex="0"]') as HTMLElement
      if (button) {
        button.blur()
      }
    }
    // Appeler la navigation
    await handleNavigation(path, item)
  }

  // Fonction pour vérifier si un item est en cours de navigation
  const isItemNavigating = (item: string) => {
    return isNavigating && navigatingItem === item
  }

  // Fonction helper pour créer un élément de menu avec spinner
  const createMenuLink = (path: string, item: string, label: string, isMobile = false) => {
    const handleClick = () => {
      if (isMobile) {
        handleMenuNavigation(path, item)
      } else {
        handleNavigation(path, item)
      }
    }

    return (
      <a 
        onClick={handleClick} 
        className={`flex items-center gap-2 ${isMobile ? '' : ''}`}
      >
        {isItemNavigating(item) ? (
          <>
            <span className="loading loading-spinner loading-sm"></span>
            <span>{label}</span>
          </>
        ) : (
          <span>{label}</span>
        )}
      </a>
    )
  }

  // Fermer le menu dropdown quand la page est chargée (pathname change)
  useEffect(() => {
    // Fermer le menu mobile
    setIsMobileMenuOpen(false)
    
    // Fermer le dropdown mobile en retirant le focus
    if (mobileMenuRef.current) {
      const button = mobileMenuRef.current.querySelector('[tabIndex="0"]') as HTMLElement
      if (button) {
        button.blur()
      }
    }
    
    // Fermer les sous-menus desktop en retirant l'attribut open des details
    if (desktopMenuRef.current) {
      const details = desktopMenuRef.current.querySelectorAll('details[open]')
      details.forEach((detail) => {
        ;(detail as HTMLDetailsElement).removeAttribute('open')
      })
    }
  }, [pathname])

  if (!isLoggedIn || isLoading) {
    return null
  }

  // Fonction pour rendre les items de menu pour mobile
  const renderMobileMenuItems = () => {
    if (canAccessCollection && !isAdmin) {
      return (
        <>
          <li>
            <a onClick={() => handleMenuNavigation('/dashboard', 'dashboard')} className="flex items-center gap-2">
              {isItemNavigating('dashboard') ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  <span>📊 Dashboard</span>
                </>
              ) : (
                <span>📊 Dashboard</span>
              )}
            </a>
          </li>
          <li className="divider my-1"></li>
          <li>
            <a className="menu-title text-base-content/60 text-xs font-semibold tracking-widest">🖼️ MA COLLECTION</a>
            <ul className="p-2 bg-background-white dark:bg-background-white rounded-lg mt-1 border border-border dark:border-border">
              <li>
                <a onClick={() => handleMenuNavigation('/art/myPhysicalArtwork', 'myPhysicalArtwork')} className="flex items-center gap-2">
                  {isItemNavigating('myPhysicalArtwork') ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <span>🖼️ Mes œuvres physiques</span>
                    </>
                  ) : (
                    <span>🖼️ Mes œuvres physiques</span>
                  )}
                </a>
              </li>
              <li>
                <a onClick={() => handleMenuNavigation('/art/addresses', 'addresses')} className="flex items-center gap-2">
                  {isItemNavigating('addresses') ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <span>📍 Adresses</span>
                    </>
                  ) : (
                    <span>📍 Adresses</span>
                  )}
                </a>
              </li>
              <li>
                <a onClick={() => handleMenuNavigation('/art/createPhysicalArtwok', 'createPhysicalArtwok')} className="flex items-center gap-2">
                  {isItemNavigating('createPhysicalArtwok') ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <span>➕ Créer une œuvre</span>
                    </>
                  ) : (
                    <span>➕ Créer une œuvre</span>
                  )}
                </a>
              </li>
            </ul>
          </li>
        </>
      )
    }
    
    if (isAdmin) {
      return (
        <>
          <li>
            <a onClick={() => handleMenuNavigation('/dashboard', 'dashboard')} className="flex items-center gap-2">
              {isItemNavigating('dashboard') ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  <span>📊 Dashboard</span>
                </>
              ) : (
                <span>📊 Dashboard</span>
              )}
            </a>
          </li>
          <li className="divider my-1"></li>
          <li>
            <a className="menu-title text-base-content/60 text-xs font-semibold tracking-widest">🏠 LANDING PAGES</a>
            <ul className="p-2 bg-background-white dark:bg-background-white rounded-lg mt-1 border border-border dark:border-border">
              <li>
                <a onClick={() => handleMenuNavigation('/landing/languages', 'languages')} className="flex items-center gap-2">
                  {isItemNavigating('languages') ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <span>Languages</span>
                    </>
                  ) : (
                    <span>Languages</span>
                  )}
                </a>
              </li>
              <li>
                <a onClick={() => handleMenuNavigation('/landing/translations', 'translations')} className="flex items-center gap-2">
                  {isItemNavigating('translations') ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <span>Translations</span>
                    </>
                  ) : (
                    <span>Translations</span>
                  )}
                </a>
              </li>
              <li>
                <a onClick={() => handleMenuNavigation('/landing/team', 'team')} className="flex items-center gap-2">
                  {isItemNavigating('team') ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <span>Team</span>
                    </>
                  ) : (
                    <span>Team</span>
                  )}
                </a>
              </li>
              <li>
                <a onClick={() => handleMenuNavigation('/landing/faq', 'faq')} className="flex items-center gap-2">
                  {isItemNavigating('faq') ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <span>FAQ</span>
                    </>
                  ) : (
                    <span>FAQ</span>
                  )}
                </a>
              </li>
              <li>
                <a onClick={() => handleMenuNavigation('/landing/detailedFaq', 'detailedFaq')} className="flex items-center gap-2">
                  {isItemNavigating('detailedFaq') ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <span>FAQ détaillée</span>
                    </>
                  ) : (
                    <span>FAQ détaillée</span>
                  )}
                </a>
              </li>
              <li>
                <a onClick={() => handleMenuNavigation('/landing/detailedFaqPage', 'detailedFaqPage')} className="flex items-center gap-2">
                  {isItemNavigating('detailedFaqPage') ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <span>FAQ par page</span>
                    </>
                  ) : (
                    <span>FAQ par page</span>
                  )}
                </a>
              </li>
              <li>
                <a onClick={() => handleMenuNavigation('/landing/detailedGlossary', 'detailedGlossary')} className="flex items-center gap-2">
                  {isItemNavigating('detailedGlossary') ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <span>Glossaire détaillé</span>
                    </>
                  ) : (
                    <span>Glossaire détaillé</span>
                  )}
                </a>
              </li>
              <li>
                <a onClick={() => handleMenuNavigation('/landing/landingArtists', 'landingArtists')} className="flex items-center gap-2">
                  {isItemNavigating('landingArtists') ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <span>Page artistes</span>
                    </>
                  ) : (
                    <span>Page artistes</span>
                  )}
                </a>
              </li>
              <li>
                <a onClick={() => handleMenuNavigation('/landing/presaleArtworks', 'presaleArtworks')} className="flex items-center gap-2">
                  {isItemNavigating('presaleArtworks') ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <span>Œuvres en prévente</span>
                    </>
                  ) : (
                    <span>Œuvres en prévente</span>
                  )}
                </a>
              </li>
              <li>
                <a onClick={() => handleMenuNavigation('/landing/seo-posts', 'seoPosts')} className="flex items-center gap-2">
                  {isItemNavigating('seoPosts') ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <span>Articles de blog</span>
                    </>
                  ) : (
                    <span>Articles de blog</span>
                  )}
                </a>
              </li>
            </ul>
          </li>
          <li className="divider my-1"></li>
          <li>
            <a className="menu-title text-base-content/60 text-xs font-semibold tracking-widest">📊 DATA ADMINISTRATION</a>
            <ul className="p-2 bg-background-white dark:bg-background-white rounded-lg mt-1 border border-border dark:border-border">
              <li>
                <a onClick={() => handleMenuNavigation('/dataAdministration/artists', 'artists')} className="flex items-center gap-2">
                  {isItemNavigating('artists') ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <span>Artistes</span>
                    </>
                  ) : (
                    <span>Artistes</span>
                  )}
                </a>
              </li>
              <li>
                <a onClick={() => handleMenuNavigation('/dataAdministration/artist-categories', 'artist-categories')} className="flex items-center gap-2">
                  {isItemNavigating('artist-categories') ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <span>Catégories d'artistes</span>
                    </>
                  ) : (
                    <span>Catégories d'artistes</span>
                  )}
                </a>
              </li>
              <li>
                <a onClick={() => handleMenuNavigation('/dataAdministration/artwork-mediums', 'artwork-mediums')} className="flex items-center gap-2">
                  {isItemNavigating('artwork-mediums') ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <span>Mediums d'œuvres</span>
                    </>
                  ) : (
                    <span>Mediums d'œuvres</span>
                  )}
                </a>
              </li>
              <li>
                <a onClick={() => handleMenuNavigation('/dataAdministration/artwork-styles', 'artwork-styles')} className="flex items-center gap-2">
                  {isItemNavigating('artwork-styles') ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <span>Styles d'œuvres</span>
                    </>
                  ) : (
                    <span>Styles d'œuvres</span>
                  )}
                </a>
              </li>
              <li>
                <a onClick={() => handleMenuNavigation('/dataAdministration/artwork-techniques', 'artwork-techniques')} className="flex items-center gap-2">
                  {isItemNavigating('artwork-techniques') ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <span>Techniques d'œuvres</span>
                    </>
                  ) : (
                    <span>Techniques d'œuvres</span>
                  )}
                </a>
              </li>
            </ul>
          </li>
          <li className="divider my-1"></li>
          <li>
            <a className="menu-title text-base-content/60 text-xs font-semibold tracking-widest">👥 BACKOFFICE ADMIN</a>
            <ul className="p-2 bg-background-white dark:bg-background-white rounded-lg mt-1 border border-border dark:border-border">
              <li>
                <a onClick={() => handleMenuNavigation('/boAdmin/users', 'boUsers')} className="flex items-center gap-2">
                  {isItemNavigating('boUsers') ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <span>Gestion des Membres</span>
                    </>
                  ) : (
                    <span>Gestion des Membres</span>
                  )}
                </a>
              </li>
              <li>
                <a onClick={() => handleMenuNavigation('/boAdmin/create-member', 'createMember')} className="flex items-center gap-2">
                  {isItemNavigating('createMember') ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <span>Créer un Membre</span>
                    </>
                  ) : (
                    <span>Créer un Membre</span>
                  )}
                </a>
              </li>
            </ul>
          </li>
          <li className="divider my-1"></li>
          <li>
            <a className="menu-title text-base-content/60 text-xs font-semibold tracking-widest">⛓️ BLOCKCHAIN</a>
            <ul className="p-2 bg-background-white dark:bg-background-white rounded-lg mt-1 border border-border dark:border-border">
              <li>
                <a onClick={() => handleMenuNavigation('/blockchain/smartContracts', 'smartContracts')} className="flex items-center gap-2">
                  {isItemNavigating('smartContracts') ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <span>Smart Contracts</span>
                    </>
                  ) : (
                    <span>Smart Contracts</span>
                  )}
                </a>
              </li>
              <li>
                <a onClick={() => handleMenuNavigation('/blockchain/collections', 'collections')} className="flex items-center gap-2">
                  {isItemNavigating('collections') ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <span>Collections</span>
                    </>
                  ) : (
                    <span>Collections</span>
                  )}
                </a>
              </li>
              <li>
                <a onClick={() => handleMenuNavigation('/blockchain/royaltyBeneficiaries', 'royaltyBeneficiaries')} className="flex items-center gap-2">
                  {isItemNavigating('royaltyBeneficiaries') ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <span>Royalties</span>
                    </>
                  ) : (
                    <span>Royalties</span>
                  )}
                </a>
              </li>
            </ul>
          </li>
          <li className="divider my-1"></li>
          <li>
            <a className="menu-title text-base-content/60 text-xs font-semibold tracking-widest">🛒 MARKETPLACE</a>
            <ul className="p-2 bg-background-white dark:bg-background-white rounded-lg mt-1 border border-border dark:border-border">
              <li>
                <a onClick={() => handleMenuNavigation('/admin-art/createArtwork', 'adminCreateArtwork')} className="flex items-center gap-2">
                  {isItemNavigating('adminCreateArtwork') ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <span>➕ Créer une œuvre</span>
                    </>
                  ) : (
                    <span>➕ Créer une œuvre</span>
                  )}
                </a>
              </li>
              <li>
                <a onClick={() => handleMenuNavigation('/admin-art/collection', 'adminArtCollection')} className="flex items-center gap-2">
                  {isItemNavigating('adminArtCollection') ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <span>🎨 Collection d'œuvres</span>
                    </>
                  ) : (
                    <span>🎨 Collection d'œuvres</span>
                  )}
                </a>
              </li>
              <li>
                <a onClick={() => handleMenuNavigation('/marketplace/nftsToMint', 'nftsToMint')} className="flex items-center gap-2">
                  {isItemNavigating('nftsToMint') ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <span>NFTs à minter</span>
                    </>
                  ) : (
                    <span>NFTs à minter</span>
                  )}
                </a>
              </li>
              <li>
                <a onClick={() => handleMenuNavigation('/marketplace/royaltiesSettings', 'royaltiesSettings')} className="flex items-center gap-2">
                  {isItemNavigating('royaltiesSettings') ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <span>Royalties</span>
                    </>
                  ) : (
                    <span>Royalties</span>
                  )}
                </a>
              </li>
              <li>
                <a onClick={() => handleMenuNavigation('/marketplace/marketplaceListing', 'marketplaceListing')} className="flex items-center gap-2">
                  {isItemNavigating('marketplaceListing') ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <span>Marketplace Listing</span>
                    </>
                  ) : (
                    <span>Marketplace Listing</span>
                  )}
                </a>
              </li>
              <li>
                <a onClick={() => handleMenuNavigation('/marketplace/transactions', 'transactions')} className="flex items-center gap-2">
                  {isItemNavigating('transactions') ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <span>Transactions Marketplace</span>
                    </>
                  ) : (
                    <span>Transactions Marketplace</span>
                  )}
                </a>
              </li>
              <li>
                <a onClick={() => handleMenuNavigation('/marketplace/invoices', 'invoices')} className="flex items-center gap-2">
                  {isItemNavigating('invoices') ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <span>Factures</span>
                    </>
                  ) : (
                    <span>Factures</span>
                  )}
                </a>
              </li>
            </ul>
          </li>
          <li className="divider my-1"></li>
          <li>
            <a className="menu-title text-base-content/60 text-xs font-semibold tracking-widest">🔧 TOOLS</a>
            <ul className="p-2 bg-background-white dark:bg-background-white rounded-lg mt-1 border border-border dark:border-border">
              <li>
                <a onClick={() => handleMenuNavigation('/tools/webp-converter', 'toolsWebpConverter')} className="flex items-center gap-2">
                  {isItemNavigating('toolsWebpConverter') ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <span>🖼️ Convertisseur WebP</span>
                    </>
                  ) : (
                    <span>🖼️ Convertisseur WebP</span>
                  )}
                </a>
              </li>
            </ul>
          </li>
        </>
      )
    }
    return null
  }

  return (
    <>
      {/* Menu hamburger pour mobile */}
      <div className="dropdown" ref={mobileMenuRef}>
        <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
          </svg>
        </div>
        <ul tabIndex={0} className="menu menu-sm dropdown-content bg-background-white dark:bg-background-white backdrop-blur-md rounded-box z-[1] mt-3 w-52 p-2 shadow-2xl border-2 border-border dark:border-border">
          {renderMobileMenuItems()}
        </ul>
      </div>

      {/* Menus desktop - centre */}
      <div className="navbar-center hidden lg:flex" ref={desktopMenuRef}>
        {/* Menu utilisateur normal */}
        {canAccessCollection && !isAdmin && (
          <ul className="menu menu-horizontal px-1">
            <li>
              <a 
                onClick={() => handleNavigation('/dashboard', 'dashboard')}
                className={activeItem === 'dashboard' ? 'active' : ''}
              >
                📊 Dashboard
              </a>
            </li>
            <li>
              <details>
                <summary>🖼️ Ma Collection</summary>
                <ul className="bg-background-white dark:bg-background-white backdrop-blur-md rounded-t-none p-2 shadow-2xl border-2 border-border dark:border-border">
                  <li>
                    <a onClick={() => handleNavigation('/art/myPhysicalArtwork', 'myPhysicalArtwork')}>
                      🖼️ Mes œuvres physiques
                    </a>
                  </li>
                  <li>
                    <a onClick={() => handleNavigation('/art/addresses', 'addresses')}>
                      📍 Adresses
                    </a>
                  </li>
                  <li>
                    <a onClick={() => handleNavigation('/art/createArtwork', 'createArtwork')}>
                      ➕ Créer une œuvre
                    </a>
                  </li>
                </ul>
              </details>
            </li>
          </ul>
        )}

        {/* Menu administrateur */}
        {isAdmin && (
          <ul className="menu menu-horizontal px-1">
            <li>
              <a 
                onClick={() => handleNavigation('/dashboard', 'dashboard')}
                className={activeItem === 'dashboard' ? 'active' : ''}
              >
                📊 Dashboard
              </a>
            </li>
            <li>
              <details>
                <summary>🏠 Landing</summary>
                <ul className="bg-background-white dark:bg-background-white backdrop-blur-md rounded-t-none p-2 shadow-2xl border-2 border-border dark:border-border w-60 max-h-80 overflow-y-auto">
                  <li><a onClick={() => handleNavigation('/landing/languages', 'languages')}>Languages</a></li>
                  <li><a onClick={() => handleNavigation('/landing/translations', 'translations')}>Translations</a></li>
                  <li><a onClick={() => handleNavigation('/landing/team', 'team')}>Team</a></li>
                  <li><a onClick={() => handleNavigation('/landing/faq', 'faq')}>FAQ</a></li>
                  <li><a onClick={() => handleNavigation('/landing/detailedFaq', 'detailedFaq')}>FAQ détaillée</a></li>
                  <li><a onClick={() => handleNavigation('/landing/detailedFaqPage', 'detailedFaqPage')}>FAQ par page</a></li>
                  <li><a onClick={() => handleNavigation('/landing/detailedGlossary', 'detailedGlossary')}>Glossaire détaillé</a></li>
                  <li><a onClick={() => handleNavigation('/landing/landingArtists', 'landingArtists')}>Page artistes</a></li>
                  <li><a onClick={() => handleNavigation('/landing/presaleArtworks', 'presaleArtworks')}>Œuvres en prévente</a></li>
                  <li><a onClick={() => handleNavigation('/landing/blog', 'blog')}>Articles de blog</a></li>
                </ul>
              </details>
            </li>
            <li>
              <details>
                <summary>📊 Data</summary>
                <ul className="bg-background-white dark:bg-background-white backdrop-blur-md rounded-t-none p-2 shadow-2xl border-2 border-border dark:border-border w-60">
                  <li><a onClick={() => handleNavigation('/dataAdministration/artists', 'artists')}>Artistes</a></li>
                  <li><a onClick={() => handleNavigation('/dataAdministration/artist-categories', 'artist-categories')}>Catégories d'artistes</a></li>
                  <li><a onClick={() => handleNavigation('/dataAdministration/artwork-mediums', 'artwork-mediums')}>Mediums d'œuvres</a></li>
                  <li><a onClick={() => handleNavigation('/dataAdministration/artwork-styles', 'artwork-styles')}>Styles d'œuvres</a></li>
                  <li><a onClick={() => handleNavigation('/dataAdministration/artwork-techniques', 'artwork-techniques')}>Techniques d'œuvres</a></li>
                </ul>
              </details>
            </li>
            <li>
              <details>
                <summary>👥 Admin</summary>
                <ul className="bg-background-white dark:bg-background-white backdrop-blur-md rounded-t-none p-2 shadow-2xl border-2 border-border dark:border-border">
                  <li><a onClick={() => handleNavigation('/boAdmin/users', 'boUsers')}>Gestion des Membres</a></li>
                  <li><a onClick={() => handleNavigation('/boAdmin/create-member', 'createMember')}>Créer un Membre</a></li>
                </ul>
              </details>
            </li>
            <li>
              <details>
                <summary>⛓️ Blockchain</summary>
                <ul className="bg-background-white dark:bg-background-white backdrop-blur-md rounded-t-none p-2 shadow-2xl border-2 border-border dark:border-border">
                  <li><a onClick={() => handleNavigation('/blockchain/smartContracts', 'smartContracts')}>Smart Contracts</a></li>
                  <li><a onClick={() => handleNavigation('/blockchain/collections', 'collections')}>Collections</a></li>
                  <li><a onClick={() => handleNavigation('/blockchain/royaltyBeneficiaries', 'royaltyBeneficiaries')}>Royalties</a></li>
                </ul>
              </details>
            </li>
            <li>
              <details>
                <summary>🛒 Marketplace</summary>
                <ul className="bg-background-white dark:bg-background-white backdrop-blur-md rounded-t-none p-2 shadow-2xl border-2 border-border dark:border-border w-60">
                  <li><a onClick={() => handleNavigation('/admin-art/createArtwork', 'adminCreateArtwork')}>➕ Créer une œuvre</a></li>
                  <li><a onClick={() => handleNavigation('/admin-art/collection', 'adminArtCollection')}>🎨 Collection d'œuvres</a></li>
                  <li><a onClick={() => handleNavigation('/marketplace/nftsToMint', 'nftsToMint')}>NFTs à minter</a></li>
                  <li><a onClick={() => handleNavigation('/marketplace/royaltiesSettings', 'royaltiesSettings')}>Royalties</a></li>
                  <li><a onClick={() => handleNavigation('/marketplace/marketplaceListing', 'marketplaceListing')}>Marketplace Listing</a></li>
                  <li><a onClick={() => handleNavigation('/marketplace/transactions', 'transactions')}>Transactions Marketplace</a></li>
                  <li><a onClick={() => handleNavigation('/marketplace/invoices', 'invoices')}>Factures</a></li>
                </ul>
              </details>
            </li>
            <li>
              <details>
                <summary>🔧 Tools</summary>
                <ul className="bg-background-white dark:bg-background-white backdrop-blur-md rounded-t-none p-2 shadow-2xl border-2 border-border dark:border-border">
                  <li><a onClick={() => handleNavigation('/tools/webp-converter', 'toolsWebpConverter')}>🖼️ Convertisseur WebP</a></li>
                </ul>
              </details>
            </li>
          </ul>
        )}
      </div>
    </>
  )
}
