'use client'

export default function MenuSeparator({ isCollapsed = false }: { isCollapsed?: boolean }) {
  return <div className={`menu-separator ${isCollapsed ? 'collapsed' : ''}`}></div>
} 