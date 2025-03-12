'use client'

import { useRef, useEffect } from 'react'
import SideMenuItem from './SideMenuItem'
import styles from './ShopifySubMenu.module.scss'

interface ShopifySubMenuProps {
  isActive: boolean
  isOpen: boolean
  toggleSubmenu: (e?: React.MouseEvent) => void
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
    <div className={styles.shopifyMenuContainer} ref={menuRef}>
      <SideMenuItem
        label="Shopify"
        isActive={isActive}
        onClick={toggleSubmenu}
        isSubmenuHeader
        isOpen={isOpen}
      />
      
      {isOpen && (
        <div className={styles.shopifySubmenuVertical}>
          <SideMenuItem 
            label="Créer membre"
            isActive={isActive && location.pathname.includes('/shopify/create-member')}
            onClick={() => onNavigate('/shopify/create-member', 'createMember')}
          />
          <SideMenuItem 
            label="Utilisateurs"
            isActive={isActive && location.pathname.includes('/shopify/users')}
            onClick={() => onNavigate('/shopify/users', 'shopifyUsers')}
          />
        </div>
      )}
    </div>
  )
}