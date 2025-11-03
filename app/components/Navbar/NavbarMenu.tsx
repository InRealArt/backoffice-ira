'use client'

import { useSideMenuLogic } from '../SideMenu/useSideMenuLogic'
import { authClient } from '@/lib/auth-client'

export default function NavbarMenu() {
  const {
    isLoggedIn,
    activeItem,
    canAccessCollection,
    isAdmin,
    isLoading,
    handleNavigation
  } = useSideMenuLogic()

  const handleSignOut = async () => {
    await authClient.signOut()
  }

  if (!isLoggedIn || isLoading) {
    return null
  }

  // Fonction pour rendre les items de menu pour mobile
  const renderMobileMenuItems = () => {
    if (canAccessCollection && !isAdmin) {
      return (
        <>
          <li>
            <a onClick={() => handleNavigation('/dashboard', 'dashboard')}>
              📊 Dashboard
            </a>
          </li>
          <li className="divider my-1"></li>
          <li>
            <a className="menu-title text-base-content/60 text-xs font-semibold tracking-widest">🖼️ MA COLLECTION</a>
            <ul className="p-2 bg-base-50 rounded-lg mt-1">
              <li><a onClick={() => handleNavigation('/art/collection', 'collection')}>Collection</a></li>
              <li><a onClick={() => handleNavigation('/art/addresses', 'addresses')}>📍 Adresses</a></li>
              <li><a onClick={() => handleNavigation('/art/createArtwork', 'createArtwork')}>➕ Créer une œuvre</a></li>
            </ul>
          </li>
        </>
      )
    }
    
    if (isAdmin) {
      return (
        <>
          <li>
            <a onClick={() => handleNavigation('/dashboard', 'dashboard')}>
              📊 Dashboard
            </a>
          </li>
          <li className="divider my-1"></li>
          <li>
            <a className="menu-title text-base-content/60 text-xs font-semibold tracking-widest">🏠 LANDING PAGES</a>
            <ul className="p-2 bg-base-50 rounded-lg mt-1">
              <li><a onClick={() => handleNavigation('/landing/languages', 'languages')}>Languages</a></li>
              <li><a onClick={() => handleNavigation('/landing/translations', 'translations')}>Translations</a></li>
              <li><a onClick={() => handleNavigation('/landing/team', 'team')}>Team</a></li>
              <li><a onClick={() => handleNavigation('/landing/faq', 'faq')}>FAQ</a></li>
              <li><a onClick={() => handleNavigation('/landing/detailedFaq', 'detailedFaq')}>FAQ détaillée</a></li>
              <li><a onClick={() => handleNavigation('/landing/detailedFaqPage', 'detailedFaqPage')}>FAQ par page</a></li>
              <li><a onClick={() => handleNavigation('/landing/detailedGlossary', 'detailedGlossary')}>Glossaire détaillé</a></li>
              <li><a onClick={() => handleNavigation('/landing/landingArtists', 'landingArtists')}>Page artistes</a></li>
              <li><a onClick={() => handleNavigation('/landing/presaleArtworks', 'presaleArtworks')}>Œuvres en prévente</a></li>
              <li><a onClick={() => handleNavigation('/landing/seo-posts', 'seoPosts')}>Articles de blog</a></li>
            </ul>
          </li>
          <li className="divider my-1"></li>
          <li>
            <a className="menu-title text-base-content/60 text-xs font-semibold tracking-widest">📊 DATA ADMINISTRATION</a>
            <ul className="p-2 bg-base-50 rounded-lg mt-1">
              <li><a onClick={() => handleNavigation('/dataAdministration/artists', 'artists')}>Artistes</a></li>
              <li><a onClick={() => handleNavigation('/dataAdministration/artist-categories', 'artist-categories')}>Catégories d'artistes</a></li>
              <li><a onClick={() => handleNavigation('/dataAdministration/artwork-mediums', 'artwork-mediums')}>Mediums d'œuvres</a></li>
              <li><a onClick={() => handleNavigation('/dataAdministration/artwork-styles', 'artwork-styles')}>Styles d'œuvres</a></li>
              <li><a onClick={() => handleNavigation('/dataAdministration/artwork-techniques', 'artwork-techniques')}>Techniques d'œuvres</a></li>
            </ul>
          </li>
          <li className="divider my-1"></li>
          <li>
            <a className="menu-title text-base-content/60 text-xs font-semibold tracking-widest">👥 BACKOFFICE ADMIN</a>
            <ul className="p-2 bg-base-50 rounded-lg mt-1">
              <li><a onClick={() => handleNavigation('/boAdmin/users', 'boUsers')}>Gestion des Membres</a></li>
              <li><a onClick={() => handleNavigation('/boAdmin/create-member', 'createMember')}>Créer un Membre</a></li>
            </ul>
          </li>
          <li className="divider my-1"></li>
          <li>
            <a className="menu-title text-base-content/60 text-xs font-semibold tracking-widest">⛓️ BLOCKCHAIN</a>
            <ul className="p-2 bg-base-50 rounded-lg mt-1">
              <li><a onClick={() => handleNavigation('/blockchain/smartContracts', 'smartContracts')}>Smart Contracts</a></li>
              <li><a onClick={() => handleNavigation('/blockchain/collections', 'collections')}>Collections</a></li>
              <li><a onClick={() => handleNavigation('/blockchain/royaltyBeneficiaries', 'royaltyBeneficiaries')}>Royalties</a></li>
            </ul>
          </li>
          <li className="divider my-1"></li>
          <li>
            <a className="menu-title text-base-content/60 text-xs font-semibold tracking-widest">🛒 MARKETPLACE</a>
            <ul className="p-2 bg-base-50 rounded-lg mt-1">
              <li><a onClick={() => handleNavigation('/admin-art/createArtwork', 'adminCreateArtwork')}>➕ Créer une œuvre</a></li>
              <li><a onClick={() => handleNavigation('/admin-art/collection', 'adminArtCollection')}>🎨 Collection d'œuvres</a></li>
              <li><a onClick={() => handleNavigation('/marketplace/nftsToMint', 'nftsToMint')}>NFTs à minter</a></li>
              <li><a onClick={() => handleNavigation('/marketplace/royaltiesSettings', 'royaltiesSettings')}>Royalties</a></li>
              <li><a onClick={() => handleNavigation('/marketplace/marketplaceListing', 'marketplaceListing')}>Marketplace Listing</a></li>
              <li><a onClick={() => handleNavigation('/marketplace/transactions', 'transactions')}>Transactions Marketplace</a></li>
              <li><a onClick={() => handleNavigation('/marketplace/invoices', 'invoices')}>Factures</a></li>
            </ul>
          </li>
          <li className="divider my-1"></li>
          <li>
            <a className="menu-title text-base-content/60 text-xs font-semibold tracking-widest">🔧 TOOLS</a>
            <ul className="p-2 bg-base-50 rounded-lg mt-1">
              <li><a onClick={() => handleNavigation('/tools/webp-converter', 'toolsWebpConverter')}>🖼️ Convertisseur WebP</a></li>
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
      <div className="dropdown">
        <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h8m-8 6h16" />
          </svg>
        </div>
        <ul tabIndex={0} className="menu menu-sm dropdown-content bg-base-100/95 backdrop-blur-md rounded-box z-[1] mt-3 w-52 p-2 shadow-2xl border-2 border-base-300" style={{backgroundColor: 'rgb(255 255 255 / 0.98)', backdropFilter: 'blur(12px) saturate(180%)', WebkitBackdropFilter: 'blur(12px) saturate(180%)'}}>
          {renderMobileMenuItems()}
        </ul>
      </div>

      {/* Menus desktop - centre */}
      <div className="navbar-center hidden lg:flex">
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
                <ul className="bg-base-100/95 backdrop-blur-md rounded-t-none p-2 shadow-2xl border-2 border-base-300" style={{backgroundColor: 'rgb(255 255 255 / 0.98)', backdropFilter: 'blur(12px) saturate(180%)', WebkitBackdropFilter: 'blur(12px) saturate(180%)'}}>
                  <li>
                    <a onClick={() => handleNavigation('/art/collection', 'collection')}>
                      Collection
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
                <ul className="bg-base-100/95 backdrop-blur-md rounded-t-none p-2 shadow-2xl border-2 border-base-300 w-60 max-h-80 overflow-y-auto" style={{backgroundColor: 'rgb(255 255 255 / 0.98)', backdropFilter: 'blur(12px) saturate(180%)', WebkitBackdropFilter: 'blur(12px) saturate(180%)'}}>
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
                <ul className="bg-base-100/95 backdrop-blur-md rounded-t-none p-2 shadow-2xl border-2 border-base-300 w-60" style={{backgroundColor: 'rgb(255 255 255 / 0.98)', backdropFilter: 'blur(12px) saturate(180%)', WebkitBackdropFilter: 'blur(12px) saturate(180%)'}}>
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
                <ul className="bg-base-100/95 backdrop-blur-md rounded-t-none p-2 shadow-2xl border-2 border-base-300" style={{backgroundColor: 'rgb(255 255 255 / 0.98)', backdropFilter: 'blur(12px) saturate(180%)', WebkitBackdropFilter: 'blur(12px) saturate(180%)'}}>
                  <li><a onClick={() => handleNavigation('/boAdmin/users', 'boUsers')}>Gestion des Membres</a></li>
                  <li><a onClick={() => handleNavigation('/boAdmin/create-member', 'createMember')}>Créer un Membre</a></li>
                </ul>
              </details>
            </li>
            <li>
              <details>
                <summary>⛓️ Blockchain</summary>
                <ul className="bg-base-100/95 backdrop-blur-md rounded-t-none p-2 shadow-2xl border-2 border-base-300" style={{backgroundColor: 'rgb(255 255 255 / 0.98)', backdropFilter: 'blur(12px) saturate(180%)', WebkitBackdropFilter: 'blur(12px) saturate(180%)'}}>
                  <li><a onClick={() => handleNavigation('/blockchain/smartContracts', 'smartContracts')}>Smart Contracts</a></li>
                  <li><a onClick={() => handleNavigation('/blockchain/collections', 'collections')}>Collections</a></li>
                  <li><a onClick={() => handleNavigation('/blockchain/royaltyBeneficiaries', 'royaltyBeneficiaries')}>Royalties</a></li>
                </ul>
              </details>
            </li>
            <li>
              <details>
                <summary>🛒 Marketplace</summary>
                <ul className="bg-base-100/95 backdrop-blur-md rounded-t-none p-2 shadow-2xl border-2 border-base-300 w-60" style={{backgroundColor: 'rgb(255 255 255 / 0.98)', backdropFilter: 'blur(12px) saturate(180%)', WebkitBackdropFilter: 'blur(12px) saturate(180%)'}}>
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
                <ul className="bg-base-100/95 backdrop-blur-md rounded-t-none p-2 shadow-2xl border-2 border-base-300" style={{backgroundColor: 'rgb(255 255 255 / 0.98)', backdropFilter: 'blur(12px) saturate(180%)', WebkitBackdropFilter: 'blur(12px) saturate(180%)'}}>
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
