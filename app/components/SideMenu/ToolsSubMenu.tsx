'use client'

import SideMenuItem from './SideMenuItem'
import MenuSeparator from './MenuSeparator'
import { Wrench, Image } from 'lucide-react'

interface ToolsSubMenuProps {
  isActive: boolean
  isOpen: boolean
  toggleSubmenu: () => void
  onNavigate: (path: string, item: string) => void
  isCollapsed?: boolean
}

export default function ToolsSubMenu({ 
  isActive, 
  isOpen, 
  toggleSubmenu, 
  onNavigate, 
  isCollapsed = false 
}: ToolsSubMenuProps) {
  return (
    <>
      <SideMenuItem
        label="Outils"
        isActive={isActive}
        onClick={toggleSubmenu}
        isCollapsed={isCollapsed}
        icon={<Wrench size={20} />}
        hasSubmenu={true}
        isSubmenuOpen={isOpen}
      />
      
      {isOpen && !isCollapsed && (
        <div className="submenu">
          <SideMenuItem
            label="Convertisseur WebP"
            isActive={isActive}
            onClick={() => onNavigate('/tools/webp-converter', 'toolsWebpConverter')}
            isCollapsed={isCollapsed}
            icon={<Image size={18} />}
            isSubmenuItem={true}
          />
        </div>
      )}
    </>
  )
}
