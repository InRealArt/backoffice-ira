'use client'

import { useRef, useEffect } from 'react'
import SideMenuItem from './SideMenuItem'
import styles from './BlockchainSubMenu.module.scss'

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
    <div className={styles.blockchainMenuContainer} ref={menuRef}>
      <SideMenuItem
        label="Blockchain"
        isActive={isActive}
        onClick={toggleSubmenu}
        isSubmenuHeader
        isOpen={isOpen}
      />
      
      {isOpen && (
        <div className={styles.blockchainSubmenuVertical}>
          <div className={styles.submenuItemVertical}>
            <SideMenuItem 
              label="Smart Contracts"
              isActive={isActive && location.pathname.includes('/blockchain/smartContracts')}
              onClick={() => onNavigate('/blockchain/smartContracts', 'adminBlockchain')}
            />
          </div>
          <div className={styles.submenuItemVertical}>
            <SideMenuItem 
              label="Collections"
              isActive={isActive && location.pathname.includes('/blockchain/collections')}
              onClick={() => onNavigate('/blockchain/collections', 'adminBlockchain')}
            />
          </div>
          <div className={styles.submenuItemVertical}>
            <SideMenuItem 
              label="Artistes"
              isActive={isActive && location.pathname.includes('/blockchain/artists')}
              onClick={() => onNavigate('/blockchain/artists', 'adminBlockchain')}
            />
          </div>
          <div className={styles.submenuItemVertical}>
            <SideMenuItem 
              label="Royalties"
              isActive={isActive && location.pathname.includes('/blockchain/royaltyBeneficiaries')}
              onClick={() => onNavigate('/blockchain/royaltyBeneficiaries', 'adminBlockchain')}
            />
          </div>
        </div>
      )}
    </div>
  )
} 