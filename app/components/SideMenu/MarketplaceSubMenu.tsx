'use client'

import { MouseEvent } from 'react'
import { ShoppingBag } from 'lucide-react'
import { usePathname } from 'next/navigation'
import SideMenuItem from './SideMenuItem'

interface MarketplaceSubMenuProps {
  isActive: boolean
  isOpen: boolean
  toggleSubmenu: (e?: MouseEvent) => void
  onNavigate: (route: string, menuItem: string) => void
}

export default function MarketplaceSubMenu({
  isActive,
  isOpen,
  toggleSubmenu,
  onNavigate
}: MarketplaceSubMenuProps) {
  const pathname = usePathname()
  
  return (
    <>
      <SideMenuItem
        label="Marketplace"
        isActive={isActive}
        onClick={toggleSubmenu}
        isSubmenuHeader={true}
        isOpen={isOpen}
      />
      
      {isOpen && (
        <div className="submenu-container">
          <SideMenuItem
            label="Oeuvres à minter"
            isActive={isActive && pathname.includes('/marketplace/nftsToMint')}
            onClick={() => onNavigate('/marketplace/nftsToMint', 'adminMarketplace')}
          />
          <SideMenuItem
            label="Configuration des royalties"
            isActive={isActive && pathname.includes('/marketplace/royaltiesSettings')}
            onClick={() => onNavigate('/marketplace/royaltiesSettings', 'adminMarketplace')}
          />
          <SideMenuItem
            label="Configuration des royalties"
            isActive={isActive && pathname.includes('/marketplace/marketplaceListing')}
            onClick={() => onNavigate('/marketplace/marketplaceListing', 'adminMarketplace')}
          />
        </div>
      )}
    </>
  )
} 