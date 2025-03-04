'use client'

interface SideMenuItemProps {
  label: string
  isActive: boolean
  onClick: (e?: React.MouseEvent) => void
  isSubmenuHeader?: boolean
  isOpen?: boolean
}

export default function SideMenuItem({ 
  label, 
  isActive, 
  onClick, 
  isSubmenuHeader,
  isOpen 
}: SideMenuItemProps) {
  return (
    <li 
      className={`menu-item ${isActive ? 'active' : ''} ${isSubmenuHeader ? 'submenu-header' : ''}`}
      onClick={onClick}
    >
      {label}
      {isSubmenuHeader && <span className={`arrow ${isOpen ? 'open' : ''}`}>▼</span>}
    </li>
  )
}