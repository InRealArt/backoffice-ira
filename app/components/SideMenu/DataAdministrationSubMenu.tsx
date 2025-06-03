'use client'

import React from 'react'
import SideMenuItem from './SideMenuItem'

interface DataAdministrationSubMenuProps {
  isActive: boolean
  isOpen: boolean
  toggleSubmenu: () => void
  onNavigate: (path: string, item: string) => void
  isCollapsed?: boolean
}

export default function DataAdministrationSubMenu({ isActive, isOpen, toggleSubmenu, onNavigate, isCollapsed = false }: DataAdministrationSubMenuProps) {
  return (
    <>
      <SideMenuItem 
        label="Data Administration" 
        isActive={isActive}
        hasSubmenu={true}
        isSubmenuOpen={isOpen}
        onClick={toggleSubmenu}
        isCollapsed={isCollapsed}
      />
      
      {isOpen && !isCollapsed && (
        <ul className="submenu">
          <SideMenuItem 
            label="Categories Oeuvres" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/dataAdministration/itemCategories', 'itemCategories')}
          />
          <SideMenuItem 
            label="Artistes" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/dataAdministration/artists', 'artists')}
          />
          <SideMenuItem
            label="Mediums d'œuvres"
            isSubmenuItem={true}
            onClick={() => onNavigate('/dataAdministration/artwork-mediums', 'artwork-mediums')}
          />
        </ul>
      )}
      
      {isOpen && isCollapsed && (
        <ul className="submenu visible">
          <SideMenuItem 
            label="Categories Oeuvres" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/dataAdministration/itemCategories', 'itemCategories')}
          />
          <SideMenuItem 
            label="Artistes" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/dataAdministration/artists', 'artists')}
          />
          <SideMenuItem
            label="Mediums d'œuvres"
            isSubmenuItem={true}
            onClick={() => onNavigate('/dataAdministration/artwork-mediums', 'artwork-mediums')}
          />
        </ul>
      )}
    </>
  )
} 