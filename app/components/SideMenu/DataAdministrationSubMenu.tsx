'use client'

import React from 'react'
import SideMenuItem from './SideMenuItem'
import { Database, Users, Folder, Palette, Brush, Wrench, Tag } from 'lucide-react'

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
        icon={<Database size={20} />}
      />
      
      {isOpen && !isCollapsed && (
        <ul className="submenu">
          <SideMenuItem 
            label="Artistes" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/dataAdministration/artists', 'artists')}
            icon={<Users size={18} />}
          />
          <SideMenuItem 
            label="Catégories d'artistes" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/dataAdministration/artist-categories', 'artist-categories')}
            icon={<Tag size={18} />}
          />
          <SideMenuItem
            label="Mediums d'œuvres"
            isSubmenuItem={true}
            onClick={() => onNavigate('/dataAdministration/artwork-mediums', 'artwork-mediums')}
            icon={<Palette size={18} />}
          />
          <SideMenuItem
            label="Styles d'œuvres"
            isSubmenuItem={true}
            onClick={() => onNavigate('/dataAdministration/artwork-styles', 'artwork-styles')}
            icon={<Brush size={18} />}
          />
          <SideMenuItem
            label="Techniques d'œuvres"
            isSubmenuItem={true}
            onClick={() => onNavigate('/dataAdministration/artwork-techniques', 'artwork-techniques')}
            icon={<Wrench size={18} />}
          />
        </ul>
      )}
      
      {isOpen && isCollapsed && (
        <ul className="submenu visible">
          <SideMenuItem 
            label="Categories Oeuvres" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/dataAdministration/itemCategories', 'itemCategories')}
            icon={<Folder size={18} />}
          />
          <SideMenuItem 
            label="Artistes" 
            isSubmenuItem={true}
            onClick={() => onNavigate('/dataAdministration/artists', 'artists')}
            icon={<Users size={18} />}
          />
          <SideMenuItem
            label="Mediums d'œuvres"
            isSubmenuItem={true}
            onClick={() => onNavigate('/dataAdministration/artwork-mediums', 'artwork-mediums')}
            icon={<Palette size={18} />}
          />
          <SideMenuItem
            label="Styles d'œuvres"
            isSubmenuItem={true}
            onClick={() => onNavigate('/dataAdministration/artwork-styles', 'artwork-styles')}
            icon={<Brush size={18} />}
          />
          <SideMenuItem
            label="Techniques d'œuvres"
            isSubmenuItem={true}
            onClick={() => onNavigate('/dataAdministration/artwork-techniques', 'artwork-techniques')}
            icon={<Wrench size={18} />}
          />
        </ul>
      )}
    </>
  )
} 