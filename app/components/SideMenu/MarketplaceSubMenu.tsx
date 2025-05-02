'use client'

import React from 'react'
import SideMenuItem from './SideMenuItem'

interface MarketplaceSubMenuProps {
  isActive: boolean
  isOpen: boolean
  toggleSubmenu: () => void
  onNavigate: (path: string, item: string) => void
  isCollapsed?: boolean
}

export default function MarketplaceSubMenu({ isActive, isOpen, toggleSubmenu, onNavigate, isCollapsed = false }: MarketplaceSubMenuProps) {
  return (
    <>
      <SideMenuItem 
        label="Marketplace" 
        isActive={isActive}
        hasSubmenu={true}
        isSubmenuOpen={isOpen}
        onClick={toggleSubmenu}
        isCollapsed={isCollapsed}
      />
      
      {isOpen && !isCollapsed && (
        <ul className="submenu">
          <SideMenuItem 
            label="NFTs à minter" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/marketplace/nftsToMint', 'nftsToMint')}
          />
          <SideMenuItem 
            label="Royalties" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/marketplace/royaltiesSettings', 'royaltiesSettings')}
          />
          <SideMenuItem 
            label="Marketplace Listing" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/marketplace/marketplaceListing', 'marketplaceListing')}
          />
          <SideMenuItem 
            label="Transactions Marketplace" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/marketplace/transactions', 'transactions')}
          />
          <SideMenuItem 
            label="Factures" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/marketplace/invoices', 'invoices')}
          />
        </ul>
      )}
      
      {isOpen && isCollapsed && (
        <ul className="submenu visible">
          <SideMenuItem 
            label="NFTs à minter" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/marketplace/nftsToMint', 'nftsToMint')}
          />
          <SideMenuItem 
            label="Royalties" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/marketplace/royaltiesSettings', 'royaltiesSettings')}
          />
          <SideMenuItem 
            label="Marketplace Listing" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/marketplace/marketplaceListing', 'marketplaceListing')}
          />
          <SideMenuItem 
            label="Transactions Marketplace" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/marketplace/transactions', 'transactions')}
          />
          <SideMenuItem 
            label="Factures" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/marketplace/invoices', 'invoices')}
          />
        </ul>
      )}
    </>
  )
} 