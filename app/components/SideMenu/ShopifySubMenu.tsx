'use client'

import { useRef, useEffect } from 'react'

interface ShopifySubMenuProps {
  isActive: boolean
  isOpen: boolean
  toggleSubmenu: (e: React.MouseEvent) => void
  onNavigate: (route: string, menuItem: string) => void
}

export default function ShopifySubMenu({ 
  isActive, 
  isOpen, 
  toggleSubmenu, 
  onNavigate 
}: ShopifySubMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)
  
  // Fermer le sous-menu lors d'un clic à l'extérieur
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        // Cette fonction doit être appelée avec un événement factice
        // pour éviter la propagation de l'événement original
        toggleSubmenu({ stopPropagation: () => {} } as React.MouseEvent)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, toggleSubmenu])
  
  return (
    <div className="shopify-menu-container" ref={menuRef}>
      <li 
        className={`menu-item ${isActive ? 'active' : ''} ${isOpen ? 'submenu-open' : ''}`}
        onClick={toggleSubmenu}
      >
        Shopify
        <span className="submenu-arrow">
          {isOpen ? '▲' : '▼'}
        </span>
      </li>
      
      {isOpen && (
        <div className="shopify-submenu">
          <ul className="submenu-list">
            <li 
              className="submenu-item"
              onClick={() => onNavigate('/shopify/create-member', 'createMember')}
            >
              Créer membre
            </li>
            <li 
              className="submenu-item"
              onClick={() => onNavigate('/shopify/users', 'shopifyUsers')}
            >
              Utilisateurs
            </li>
          </ul>
        </div>
      )}
    </div>
  )
}