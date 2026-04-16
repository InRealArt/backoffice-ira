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
import { LayoutDashboard, Image, MapPin, PlusCircle, Users, Layout } from 'lucide-react'

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
    isGalleryLjManager,
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
          icon={<LayoutDashboard size={20} />}
        />
        
        {canAccessCollection && !isAdmin && !isGalleryLjManager && (
          <>
            <MenuSeparator isCollapsed={isMenuCollapsed} />
            <SideMenuItem
              label="Mes œuvres physiques"
              isActive={activeItem === 'myPhysicalArtwork'}
              onClick={() => handleNavigation('/art/myPhysicalArtwork', 'myPhysicalArtwork')}
              isCollapsed={isMenuCollapsed}
              icon={<Image size={20} />}
            />
            <SideMenuItem
              label="Adresses"
              isActive={activeItem === 'addresses'}
              onClick={() => handleNavigation('/art/addresses', 'addresses')}
              isCollapsed={isMenuCollapsed}
              icon={<MapPin size={20} />}
            />
            <SideMenuItem
              label="Créer une œuvre physique"
              isActive={activeItem === 'createArtwork'}
              onClick={() => handleNavigation('/art/createPhysicalArtwok', 'createArtwork')}
              isCollapsed={isMenuCollapsed}
              icon={<PlusCircle size={20} />}
            />
          </>
        )}

        {isGalleryLjManager && (
          <>
            <MenuSeparator isCollapsed={isMenuCollapsed} />
            <SideMenuItem
              label="Dashboard"
              isActive={activeItem === 'galleryLjDashboard'}
              onClick={() => handleNavigation('/fr/galleryLj/dashboard', 'galleryLjDashboard')}
              isCollapsed={isMenuCollapsed}
              icon={<LayoutDashboard size={20} />}
            />
            <SideMenuItem
              label="Artistes Gallery LJ"
              isActive={activeItem === 'galleryLjArtists'}
              onClick={() => handleNavigation('/fr/galleryLj/artists', 'galleryLjArtists')}
              isCollapsed={isMenuCollapsed}
              icon={<Users size={20} />}
            />
            <SideMenuItem
              label="Hero Galerie LJ"
              isActive={activeItem === 'galleryLjHero'}
              onClick={() => handleNavigation('/fr/galleryLj/hero', 'galleryLjHero')}
              isCollapsed={isMenuCollapsed}
              icon={<Layout size={20} />}
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