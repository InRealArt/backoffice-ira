'use client'

import './SideMenu.css'
import SideMenuItem from './SideMenuItem'
import ShopifySubMenu from './ShopifySubMenu'
import BlockchainSubMenu from './BlockchainSubMenu'
import { useSideMenuLogic } from './useSideMenuLogic'

export default function SideMenu() {
  const {
    isLoggedIn,
    activeItem,
    canAccessCollection,
    isAdmin,
    showShopifySubmenu,
    showBlockchainSubmenu,
    handleNavigation,
    toggleShopifySubmenu,
    toggleBlockchainSubmenu
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
            <ShopifySubMenu
              isActive={activeItem === 'adminShopify'}
              isOpen={showShopifySubmenu}
              toggleSubmenu={toggleShopifySubmenu}
              onNavigate={handleNavigation}
            />
            <BlockchainSubMenu
              isActive={activeItem === 'adminBlockchain'}
              isOpen={showBlockchainSubmenu}
              toggleSubmenu={toggleBlockchainSubmenu}
              onNavigate={handleNavigation}
            />
          </>
        )}
      </ul>
    </div>
  )
}