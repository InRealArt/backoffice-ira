'use client'

import React from 'react'
import SideMenuItem from './SideMenuItem'

interface BlockchainSubMenuProps {
  isActive: boolean
  isOpen: boolean
  toggleSubmenu: () => void
  onNavigate: (path: string, item: string) => void
  isCollapsed?: boolean
}

export default function BlockchainSubMenu({ isActive, isOpen, toggleSubmenu, onNavigate, isCollapsed = false }: BlockchainSubMenuProps) {
  return (
    <>
      <SideMenuItem 
        label="Blockchain" 
        isActive={isActive}
        hasSubmenu={true}
        isSubmenuOpen={isOpen}
        onClick={toggleSubmenu}
        isCollapsed={isCollapsed}
      />
      
      {isOpen && !isCollapsed && (
        <ul className="submenu">
          <SideMenuItem 
            label="Smart Contracts" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/blockchain/smartContracts', 'smartContracts')}
          />
          <SideMenuItem 
            label="Collections" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/blockchain/collections', 'collections')}
          />
          <SideMenuItem 
            label="Royalties" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/blockchain/royaltyBeneficiaries', 'royaltyBeneficiaries')}
          />
        </ul>
      )}
      
      {isOpen && isCollapsed && (
        <ul className="submenu visible">
          <SideMenuItem 
            label="Smart Contracts" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/blockchain/smartContracts', 'smartContracts')}
          />
          <SideMenuItem 
            label="Collections" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/blockchain/collections', 'collections')}
          />
          <SideMenuItem 
            label="Royalties" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/blockchain/royalties', 'royalties')}
          />
        </ul>
      )}
    </>
  )
} 