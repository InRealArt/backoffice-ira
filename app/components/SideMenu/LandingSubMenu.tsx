'use client'

import React from 'react'
import SideMenuItem from './SideMenuItem'

interface LandingSubMenuProps {
  isActive: boolean
  isOpen: boolean
  toggleSubmenu: () => void
  onNavigate: (path: string, item: string) => void
  isCollapsed?: boolean
}

export default function LandingSubMenu({ isActive, isOpen, toggleSubmenu, onNavigate, isCollapsed = false }: LandingSubMenuProps) {
  return (
    <>
      <SideMenuItem 
        label="Landing Pages" 
        isActive={isActive}
        hasSubmenu={true}
        isSubmenuOpen={isOpen}
        onClick={toggleSubmenu}
        isCollapsed={isCollapsed}
      />
      
      {isOpen && !isCollapsed && (
        <ul className="submenu">
          <SideMenuItem 
            label="Team" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/team', 'team')}
          />
          <SideMenuItem 
            label="Languages" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/languages', 'languages')}
          />
          <SideMenuItem 
            label="Translations" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/translations', 'translations')}
          />
        </ul>
      )}
      
      {isOpen && isCollapsed && (
        <ul className="submenu visible">
          <SideMenuItem 
            label="Team" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/team', 'team')}
          />
          <SideMenuItem 
            label="Languages" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/languages', 'languages')}
          />
          <SideMenuItem 
            label="Translations" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/translations', 'translations')}
          />
        </ul>
      )}
    </>
  )
} 