'use client'

import { useRef, useEffect } from 'react'
import SideMenuItem from './SideMenuItem'

interface BlockchainSubMenuProps {
  isActive: boolean
  isOpen: boolean
  toggleSubmenu: (e: React.MouseEvent) => void
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
      <li 
        className={`menu-item ${isActive ? 'active' : ''} ${isOpen ? 'submenu-open' : ''}`}
        onClick={toggleSubmenu}
      >
        Blockchain
        <span className="submenu-arrow">
          {isOpen ? '▲' : '▼'}
        </span>
      </li>
      
      {isOpen && (
        <div className="blockchain-submenu">
          <ul className="submenu-list">
            <SideMenuItem 
              label="Artistes"
              isActive={isActive && location.pathname.includes('/blockchain/artists')}
              onClick={() => onNavigate('/blockchain/artists', 'adminBlockchain')}
            />
          </ul>
        </div>
      )}
    </div>
  )
} 