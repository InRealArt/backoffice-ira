'use client'

interface SideMenuItemProps {
  label: string
  isActive: boolean
  onClick: () => void
}

export default function SideMenuItem({ label, isActive, onClick }: SideMenuItemProps) {
  return (
    <li 
      className={`menu-item ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      {label}
    </li>
  )
}