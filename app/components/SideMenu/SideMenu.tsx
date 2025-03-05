'use client'

import './SideMenu.css'
import styles from './SideMenu.module.scss'
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
    handleNavigation,
    toggleShopifySubmenu,
    toggleBlockchainSubmenu,
    toggleMarketplaceSubmenu
  } = useSideMenuLogic()
  
  if (!isLoggedIn) return null

  return (
    <div className="side-menu">
      <ul className="menu-list">
        <SideMenuItem 
          label="Dashboard"
          isActive={activeItem === 'dashboard'}
          onClick={() => handleNavigation('/dashboard', 'dashboard')}
        />
        
        {canAccessCollection && !isAdmin && (
          <>
            <MenuSeparator />
            <SideMenuItem 
              label="Ma Collection"
              isActive={activeItem === 'collection'}
              onClick={() => handleNavigation('/shopify/collection', 'collection')}
            />
            <SideMenuItem 
              label="Créer une œuvre"
              isActive={activeItem === 'createArtwork'}
              onClick={() => handleNavigation('/shopify/createArtwork', 'createArtwork')}
            />
          </>
        )}
        
        {isAdmin && (
          <>
            <MenuSeparator />
            <ShopifySubMenu
              isActive={activeItem === 'adminShopify'}
              isOpen={showShopifySubmenu}
              toggleSubmenu={toggleShopifySubmenu}
              onNavigate={handleNavigation}
            />
            <MenuSeparator />
            <BlockchainSubMenu
              isActive={activeItem === 'adminBlockchain'}
              isOpen={showBlockchainSubmenu}
              toggleSubmenu={toggleBlockchainSubmenu}
              onNavigate={handleNavigation}
            />
            <MenuSeparator />
            <MarketplaceSubMenu
              isActive={activeItem === 'adminMarketplace'}
              isOpen={showMarketplaceSubmenu}
              toggleSubmenu={toggleMarketplaceSubmenu}
              onNavigate={handleNavigation}
            />
          </>
        )}
      </ul>
    </div>
  )
}