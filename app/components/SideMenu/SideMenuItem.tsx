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
      className={`menu-item ${isActive ? 'active' : ''} ${isSubmenuHeader ? 'submenu-header' : ''} ${isOpen ? 'submenu-open' : ''}`}
      onClick={onClick}
      role="menuitem"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      aria-current={isActive ? 'page' : undefined}
      aria-expanded={isSubmenuHeader ? isOpen : undefined}
    >
      {label}
      {isSubmenuHeader && <span className={`arrow ${isOpen ? 'open' : ''}`} aria-hidden="true">▼</span>}
    </li>
  )
}