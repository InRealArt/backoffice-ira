'use client'

import React from 'react'
import SideMenuItem from './SideMenuItem'

interface BackofficeAdminSubMenuProps {
  isActive: boolean
  isOpen: boolean
  toggleSubmenu: () => void
  onNavigate: (path: string, item: string) => void
  isCollapsed?: boolean
}

export default function BackofficeAdminSubMenu({ isActive, isOpen, toggleSubmenu, onNavigate, isCollapsed = false }: BackofficeAdminSubMenuProps) {
  return (
    <>
      <SideMenuItem 
        label="Backoffice Admin" 
        isActive={isActive}
        hasSubmenu={true}
        isSubmenuOpen={isOpen}
        onClick={toggleSubmenu}
        isCollapsed={isCollapsed}
      />
      
      {isOpen && !isCollapsed && (
        <ul className="submenu">
          <SideMenuItem 
            label="Gestion des Membres" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/boAdmin/users', 'boUsers')}
          />
        </ul>
      )}
      
      {isOpen && isCollapsed && (
        <ul className="submenu visible">
          <SideMenuItem 
            label="Gestion des Membres" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/boAdmin/users', 'boUsers')}
          />
          <SideMenuItem 
            label="Créer un Membre" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/boAdmin/create-member', 'createMember')}
          />
        </ul>
      )}
    </>
  )
}