'use client'

import React from 'react'
import SideMenuItem from './SideMenuItem'
import { Shield, Users, UserPlus } from 'lucide-react'

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
        icon={<Shield size={20} />}
      />
      
      {isOpen && !isCollapsed && (
        <ul className="submenu" role="group">
          <SideMenuItem 
            label="Gestion des Membres" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/boAdmin/users', 'boUsers')}
            icon={<Users size={18} />}
          />
        </ul>
      )}
      
      {isOpen && isCollapsed && (
        <ul className="submenu visible" role="group">
          <SideMenuItem 
            label="Gestion des Membres" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/boAdmin/users', 'boUsers')}
            icon={<Users size={18} />}
          />
          <SideMenuItem 
            label="Créer un Membre" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/boAdmin/create-member', 'createMember')}
            icon={<UserPlus size={18} />}
          />
        </ul>
      )}
    </>
  )
}