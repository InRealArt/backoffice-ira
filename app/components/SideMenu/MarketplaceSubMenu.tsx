'use client'

import SideMenuItem from './SideMenuItem'

interface MarketplaceSubMenuProps {
  isActive: boolean
  isOpen: boolean
  toggleSubmenu: () => void
  onNavigate: (path: string, item: string) => void
}

export default function MarketplaceSubMenu({ 
  isActive, 
  isOpen, 
  toggleSubmenu,
  onNavigate 
}: MarketplaceSubMenuProps) {
  return (
    <>
      <SideMenuItem
        label="Marketplace"
        isActive={isActive}
        onClick={toggleSubmenu}
        isSubmenuHeader={true}
        isOpen={isOpen}
      />
      
      <div className={`submenu-container ${isOpen ? 'open' : ''}`}>
        <ul className="submenu-list">
          <li 
            className="submenu-item"
            onClick={() => onNavigate('/marketplace/nftsToMint', 'adminMarketplace')}
            tabIndex={isOpen ? 0 : -1}
            role="menuitem"
          >
            Oeuvres à minter
          </li>
          <li 
            className="submenu-item"
            onClick={() => onNavigate('/marketplace/royaltiesSettings', 'adminMarketplace')}
            tabIndex={isOpen ? 0 : -1}
            role="menuitem"
          >
            Configuration des royalties
          </li>
          <li 
            className="submenu-item"
            onClick={() => onNavigate('/marketplace/marketplaceListing', 'adminMarketplace')}
            tabIndex={isOpen ? 0 : -1}
            role="menuitem"
          >
            Lister un NFT sur la marketplace
          </li>
        </ul>
      </div>
    </>
  )
} 