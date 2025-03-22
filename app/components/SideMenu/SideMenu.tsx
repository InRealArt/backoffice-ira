'use client'

import SideMenuItem from './SideMenuItem'
import ShopifySubMenu from './ShopifySubMenu'
import BlockchainSubMenu from './BlockchainSubMenu'
import MenuSeparator from './MenuSeparator'
import { useSideMenuLogic } from './useSideMenuLogic'
import MarketplaceSubMenu from './MarketplaceSubMenu'

export default function SideMenu() {
  const {
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
    toggleMenuCollapse
  } = useSideMenuLogic()
  
  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className={`side-menu side-menu-debug animate-side-menu ${isMenuCollapsed ? 'side-menu-collapsed' : ''}`}>
      <button 
        className="side-menu-toggle" 
        onClick={toggleMenuCollapse}
        aria-label={isMenuCollapsed ? 'Déplier le menu' : 'Plier le menu'}
      >
        <span className="toggle-icon">
          {isMenuCollapsed ? '→' : '←'}
        </span>
      </button>
      <ul className="menu-list">
        <SideMenuItem 
          label="Dashboard"
          isActive={activeItem === 'dashboard'}
          onClick={() => handleNavigation('/dashboard', 'dashboard')}
          isCollapsed={isMenuCollapsed}
          icon={<span>📊</span>}
        />
        
        {canAccessCollection && !isAdmin && (
          <>
            <MenuSeparator isCollapsed={isMenuCollapsed} />
            <SideMenuItem 
              label="Ma Collection"
              isActive={activeItem === 'collection'}
              onClick={() => handleNavigation('/shopify/collection', 'collection')}
              isCollapsed={isMenuCollapsed}
              icon={<span>🖼️</span>}
            />
            <SideMenuItem 
              label="Créer une œuvre"
              isActive={activeItem === 'createArtwork'}
              onClick={() => handleNavigation('/shopify/createArtwork', 'createArtwork')}
              isCollapsed={isMenuCollapsed}
              icon={<span>➕</span>}
            />
          </>
        )}
        
        {isAdmin && (
          <>
            <MenuSeparator isCollapsed={isMenuCollapsed} />
            <ShopifySubMenu
              isActive={activeItem === 'adminShopify'}
              isOpen={showShopifySubmenu}
              toggleSubmenu={toggleShopifySubmenu}
              onNavigate={handleNavigation}
              isCollapsed={isMenuCollapsed}
            />
            <MenuSeparator isCollapsed={isMenuCollapsed} />
            <BlockchainSubMenu
              isActive={activeItem === 'adminBlockchain'}
              isOpen={showBlockchainSubmenu}
              toggleSubmenu={toggleBlockchainSubmenu}
              onNavigate={handleNavigation}
              isCollapsed={isMenuCollapsed}
            />
            <MenuSeparator isCollapsed={isMenuCollapsed} />
            <MarketplaceSubMenu
              isActive={activeItem === 'adminMarketplace'}
              isOpen={showMarketplaceSubmenu}
              toggleSubmenu={toggleMarketplaceSubmenu}
              onNavigate={handleNavigation}
              isCollapsed={isMenuCollapsed}
            />
          </>
        )}
      </ul>
    </div>
  )
}