'use client'

import React from 'react'
import SideMenuItem from './SideMenuItem'
import { Store, PlusCircle, Folder, Sparkles, Coins, ShoppingBag, Receipt, FileText } from 'lucide-react'

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
        icon={<Store size={20} />}
      />
      
      {isOpen && !isCollapsed && (
        <ul className="submenu">
          <SideMenuItem 
            label="Créer une œuvre" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/admin-art/createArtwork', 'adminCreateArtwork')}
            icon={<PlusCircle size={18} />}
          />
          <SideMenuItem 
            label="Collection d'œuvres" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/admin-art/collection', 'adminArtCollection')}
            icon={<Folder size={18} />}
          />
          <SideMenuItem 
            label="NFTs à minter" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/marketplace/nftsToMint', 'nftsToMint')}
            icon={<Sparkles size={18} />}
          />
          <SideMenuItem 
            label="Royalties" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/marketplace/royaltiesSettings', 'royaltiesSettings')}
            icon={<Coins size={18} />}
          />
          <SideMenuItem 
            label="Marketplace Listing" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/marketplace/marketplaceListing', 'marketplaceListing')}
            icon={<ShoppingBag size={18} />}
          />
          <SideMenuItem 
            label="Transactions Marketplace" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/marketplace/transactions', 'transactions')}
            icon={<Receipt size={18} />}
          />
          <SideMenuItem 
            label="Factures" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/marketplace/invoices', 'invoices')}
            icon={<FileText size={18} />}
          />
        </ul>
      )}
      
      {isOpen && isCollapsed && (
        <ul className="submenu visible">
          <SideMenuItem 
            label="Créer une œuvre" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/admin-art/createArtwork', 'adminCreateArtwork')}
            icon={<PlusCircle size={18} />}
          />
          <SideMenuItem 
            label="Collection d'œuvres" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/admin-art/collection', 'adminArtCollection')}
            icon={<Folder size={18} />}
          />
          <SideMenuItem 
            label="NFTs à minter" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/marketplace/nftsToMint', 'nftsToMint')}
            icon={<Sparkles size={18} />}
          />
          <SideMenuItem 
            label="Royalties" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/marketplace/royaltiesSettings', 'royaltiesSettings')}
            icon={<Coins size={18} />}
          />
          <SideMenuItem 
            label="Marketplace Listing" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/marketplace/marketplaceListing', 'marketplaceListing')}
            icon={<ShoppingBag size={18} />}
          />
          <SideMenuItem 
            label="Transactions Marketplace" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/marketplace/transactions', 'transactions')}
            icon={<Receipt size={18} />}
          />
          <SideMenuItem 
            label="Factures" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/marketplace/invoices', 'invoices')}
            icon={<FileText size={18} />}
          />
        </ul>
      )}
    </>
  )
} 