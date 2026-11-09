'use client'

interface SideMenuItemProps {
  label: string
  isActive?: boolean
  onClick?: () => void
  hasSubmenu?: boolean
  isSubmenuOpen?: boolean
  isSubmenuItem?: boolean
  icon?: React.ReactNode
  isCollapsed?: boolean
}

export default function SideMenuItem({
  label,
  isActive = false,
  onClick,
  hasSubmenu = false,
  isSubmenuOpen = false,
  isSubmenuItem = false,
  icon,
  isCollapsed = false
}: SideMenuItemProps) {
  const baseClass = isSubmenuItem ? 'submenu-item' : 'menu-item'
  const activeClass = isActive ? 'active' : ''
  const submenuClass = hasSubmenu ? 'has-submenu' : ''
  const submenuOpenClass = isSubmenuOpen ? 'submenu-open' : ''
  const collapsedClass = isCollapsed ? 'collapsed' : ''
  
  return (
    <li 
      className={`${baseClass} ${activeClass} ${submenuClass} ${submenuOpenClass} ${collapsedClass}`} 
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick?.()
        }
      }}
      tabIndex={0}
      role={hasSubmenu ? 'button' : 'link'}
      aria-label={isCollapsed ? label : undefined}
      aria-current={isActive && !hasSubmenu ? 'page' : undefined}
      aria-expanded={hasSubmenu ? isSubmenuOpen : undefined}
      data-label={label}
    >
      {icon && <span className="menu-item-icon">{icon}</span>}
      {(!isCollapsed || isSubmenuItem) && <span className="menu-item-label">{label}</span>}
      {hasSubmenu && !isCollapsed && (
        <span className="submenu-indicator" aria-hidden="true">
          {isSubmenuOpen ? '▼' : '▶'}
        </span>
      )}
    </li>
  )
}