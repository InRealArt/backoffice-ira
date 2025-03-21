'use client'

import SideMenuItem from './SideMenuItem'

interface BlockchainSubMenuProps {
  isActive: boolean
  isOpen: boolean
  toggleSubmenu: () => void
  onNavigate: (path: string, item: string) => void
}

export default function BlockchainSubMenu({ 
  isActive, 
  isOpen, 
  toggleSubmenu,
  onNavigate 
}: BlockchainSubMenuProps) {
  return (
    <>
      <SideMenuItem
        label="Blockchain"
        isActive={isActive}
        onClick={toggleSubmenu}
        isSubmenuHeader={true}
        isOpen={isOpen}
      />
      
      <div className={`submenu-container ${isOpen ? 'open' : ''}`}>
        <ul className="submenu-list">
          <li 
            className="submenu-item"
            onClick={() => onNavigate('/blockchain/collections', 'adminBlockchain')}
            tabIndex={isOpen ? 0 : -1}
            role="menuitem"
          >
            Collections
          </li>
          <li 
            className="submenu-item"
            onClick={() => onNavigate('/blockchain/smartContracts', 'adminBlockchain')}
            tabIndex={isOpen ? 0 : -1}
            role="menuitem"
          >
            Smart Contracts
          </li>
          <li 
            className="submenu-item"
            onClick={() => onNavigate('/blockchain/artists', 'adminBlockchain')}
            tabIndex={isOpen ? 0 : -1}
            role="menuitem"
          >
            Artistes
          </li>
          <li 
            className="submenu-item"
            onClick={() => onNavigate('/blockchain/royaltyBeneficiaries', 'adminBlockchain')}
            tabIndex={isOpen ? 0 : -1}
            role="menuitem"
          >
            Royalties
          </li>
        </ul>
      </div>
    </>
  )
} 