'use client'

import SideMenuItem from './SideMenuItem'
import BackofficeAdminSubMenu from './BackofficeAdminSubMenu'
import BlockchainSubMenu from './BlockchainSubMenu'
import MenuSeparator from './MenuSeparator'
import { useSideMenuLogic } from './useSideMenuLogic'
import MarketplaceSubMenu from './MarketplaceSubMenu'
import DataAdministrationSubMenu from './DataAdministrationSubMenu'
import LandingSubMenu from './LandingSubMenu'
import ToolsSubMenu from './ToolsSubMenu'

// Composant de fallback pour le chargement
function SideMenuSkeleton({ isMenuCollapsed }: { isMenuCollapsed: boolean }) {
  return (
    <div className={`side-menu side-menu-debug animate-side-menu ${isMenuCollapsed ? 'side-menu-collapsed' : ''}`}>
      <button 
        className="side-menu-toggle" 
        disabled
        aria-label="Chargement du menu"
      >
        <span className="toggle-icon">
          {isMenuCollapsed ? '→' : '←'}
        </span>
      </button>
      <ul className="menu-list">
        <li className="menu-item skeleton">
          <span className="menu-item-icon">📊</span>
          {!isMenuCollapsed && <span className="menu-item-label">Chargement...</span>}
        </li>
      </ul>
    </div>
  )
}

export default function SideMenu() {
  const {
    isLoggedIn,
    activeItem,
    canAccessCollection,
    isAdmin,
    isLoading,
    showBackofficeAdminSubmenu,
    showBlockchainSubmenu,
    showMarketplaceSubmenu,
    isMenuCollapsed,
    handleNavigation,
    toggleBackofficeAdminSubmenu,
    toggleBlockchainSubmenu,
    toggleMarketplaceSubmenu,
    toggleMenuCollapse,
    showDataAdministrationSubmenu,
    toggleDataAdministrationSubmenu,
    showLandingSubmenu,
    toggleLandingSubmenu,
    showToolsSubmenu,
    toggleToolsSubmenu
  } = useSideMenuLogic()
  
  if (!isLoggedIn) {
    return null;
  }

  // Afficher le skeleton pendant le chargement des rôles
  if (isLoading) {
    return <SideMenuSkeleton isMenuCollapsed={isMenuCollapsed} />
  }

  return (
    <div className={`side-menu side-menu-debug animate-side-menu ${isMenuCollapsed ? 'side-menu-collapsed' : ''}`}>
      <button 
        className="side-menu-toggle" 
        onClick={toggleMenuCollapse}
        aria-label={isMenuCollapsed ? 'Déplier le menu' : 'Plier le menu'}
      >
        <span className="toggle-icon">
          {isMenuCollapsed ? '→' : '←'}
        </span>
      </button>
      <ul className="menu-list">
        <SideMenuItem 
          label="Dashboard"
          isActive={activeItem === 'dashboard'}
          onClick={() => handleNavigation('/dashboard', 'dashboard')}
          isCollapsed={isMenuCollapsed}
          icon={<span>📊</span>}
        />
        
        {canAccessCollection && !isAdmin && (
          <>
            <MenuSeparator isCollapsed={isMenuCollapsed} />
            <SideMenuItem 
              label="Ma Collection"
              isActive={activeItem === 'collection'}
              onClick={() => handleNavigation('/art/collection', 'collection')}
              isCollapsed={isMenuCollapsed}
              icon={<span>🖼️</span>}
            />
            <SideMenuItem 
              label="Adresses"
              isActive={activeItem === 'addresses'}
              onClick={() => handleNavigation('/art/addresses', 'addresses')}
              isCollapsed={isMenuCollapsed}
              icon={<span>📍</span>}
            />
            <SideMenuItem 
              label="Créer une œuvre"
              isActive={activeItem === 'createArtwork'}
              onClick={() => handleNavigation('/art/createArtwork', 'createArtwork')}
              isCollapsed={isMenuCollapsed}
              icon={<span>➕</span>}
            />
          </>
        )}
        
        {isAdmin && (
          <>
            <MenuSeparator isCollapsed={isMenuCollapsed} />
            <LandingSubMenu
              isActive={activeItem === 'adminLanding'}
              isOpen={showLandingSubmenu}
              toggleSubmenu={toggleLandingSubmenu}
              onNavigate={handleNavigation}
              isCollapsed={isMenuCollapsed}
            />
            <MenuSeparator isCollapsed={isMenuCollapsed} />
            <DataAdministrationSubMenu
              isActive={activeItem === 'adminDataAdministration'}
              isOpen={showDataAdministrationSubmenu}
              toggleSubmenu={toggleDataAdministrationSubmenu}
              onNavigate={handleNavigation}
              isCollapsed={isMenuCollapsed}
            />
            <BackofficeAdminSubMenu
              isActive={activeItem === 'adminBackofficeAdmin'}
              isOpen={showBackofficeAdminSubmenu}
              toggleSubmenu={toggleBackofficeAdminSubmenu}
              onNavigate={handleNavigation}
              isCollapsed={isMenuCollapsed}
            />
            <MenuSeparator isCollapsed={isMenuCollapsed} />
            <BlockchainSubMenu
              isActive={activeItem === 'adminBlockchain'}
              isOpen={showBlockchainSubmenu}
              toggleSubmenu={toggleBlockchainSubmenu}
              onNavigate={handleNavigation}
              isCollapsed={isMenuCollapsed}
            />
            <MenuSeparator isCollapsed={isMenuCollapsed} />
            <MarketplaceSubMenu
              isActive={activeItem === 'adminMarketplace'}
              isOpen={showMarketplaceSubmenu}
              toggleSubmenu={toggleMarketplaceSubmenu}
              onNavigate={handleNavigation}
              isCollapsed={isMenuCollapsed}
            />
            <MenuSeparator isCollapsed={isMenuCollapsed} />
            <ToolsSubMenu
              isActive={activeItem === 'adminTools'}
              isOpen={showToolsSubmenu}
              toggleSubmenu={toggleToolsSubmenu}
              onNavigate={handleNavigation}
              isCollapsed={isMenuCollapsed}
            />
          </>
        )}
      </ul>
    </div>
  )
}