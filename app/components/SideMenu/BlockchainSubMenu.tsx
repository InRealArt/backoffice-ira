'use client'

import React from 'react'
import SideMenuItem from './SideMenuItem'
import { Link, FileCode, Folder, Coins } from 'lucide-react'

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
        icon={<Link size={20} />}
      />
      
      {isOpen && !isCollapsed && (
        <ul className="submenu">
          <SideMenuItem 
            label="Smart Contracts" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/blockchain/smartContracts', 'smartContracts')}
            icon={<FileCode size={18} />}
          />
          <SideMenuItem 
            label="Collections" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/blockchain/collections', 'collections')}
            icon={<Folder size={18} />}
          />
          <SideMenuItem 
            label="Royalties" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/blockchain/royaltyBeneficiaries', 'royaltyBeneficiaries')}
            icon={<Coins size={18} />}
          />
        </ul>
      )}
      
      {isOpen && isCollapsed && (
        <ul className="submenu visible">
          <SideMenuItem 
            label="Smart Contracts" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/blockchain/smartContracts', 'smartContracts')}
            icon={<FileCode size={18} />}
          />
          <SideMenuItem 
            label="Collections" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/blockchain/collections', 'collections')}
            icon={<Folder size={18} />}
          />
          <SideMenuItem 
            label="Royalties" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/blockchain/royalties', 'royalties')}
            icon={<Coins size={18} />}
          />
        </ul>
      )}
    </>
  )
} 