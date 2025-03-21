'use client'

import SideMenuItem from './SideMenuItem'

interface ShopifySubMenuProps {
  isActive: boolean
  isOpen: boolean
  toggleSubmenu: () => void
  onNavigate: (path: string, item: string) => void
}

export default function ShopifySubMenu({ 
  isActive, 
  isOpen, 
  toggleSubmenu,
  onNavigate 
}: ShopifySubMenuProps) {
  return (
    <>
      <SideMenuItem
        label="Shopify"
        isActive={isActive}
        onClick={toggleSubmenu}
        isSubmenuHeader={true}
        isOpen={isOpen}
      />
      
      <div className={`submenu-container ${isOpen ? 'open' : ''}`}>
        <ul className="submenu-list">
          <li 
            className="submenu-item"
            onClick={() => onNavigate('/shopify/users', 'adminShopify')}
            tabIndex={isOpen ? 0 : -1}
            role="menuitem"
          >
            Utilisateurs
          </li>
        </ul>
      </div>
    </>
  )
}