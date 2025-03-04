'use client'

import { useRef, useEffect } from 'react'
import SideMenuItem from './SideMenuItem'

interface BlockchainSubMenuProps {
  isActive: boolean
  isOpen: boolean
  toggleSubmenu: (e?: React.MouseEvent) => void
  onNavigate: (route: string, menuItem: string) => void
}

export default function BlockchainSubMenu({ 
  isActive, 
  isOpen, 
  toggleSubmenu, 
  onNavigate 
}: BlockchainSubMenuProps) {
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
    <div className="blockchain-menu-container" ref={menuRef}>
      <SideMenuItem
        label="Blockchain"
        isActive={isActive}
        onClick={toggleSubmenu}
        isSubmenuHeader
        isOpen={isOpen}
      />
      
      {isOpen && (
        <div className="blockchain-submenu">
          <ul className="submenu-list">
            <SideMenuItem 
              label="Artistes"
              isActive={isActive && location.pathname.includes('/blockchain/artists')}
              onClick={() => onNavigate('/blockchain/artists', 'adminBlockchain')}
            />
            <SideMenuItem 
              label="Collections"
              isActive={isActive && location.pathname.includes('/blockchain/collections')}
              onClick={() => onNavigate('/blockchain/collections', 'adminBlockchain')}
            />
          </ul>
        </div>
      )}
    </div>
  )
} 