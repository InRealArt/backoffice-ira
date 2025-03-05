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
            label="Demande de listing produits"
            isActive={isActive && pathname.includes('/marketplace/product-listing-requests')}
            onClick={() => onNavigate('/marketplace/product-listing-requests', 'adminMarketplace')}
          />
        </div>
      )}
    </>
  )
} 