'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'

interface SortableHeaderProps {
  label: string
  columnKey: string
  currentSort: string
  currentOrder: string
}

export default function SortableHeader({
  label,
  columnKey,
  currentSort,
  currentOrder,
}: SortableHeaderProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const isActive = currentSort === columnKey
  const nextOrder = isActive && currentOrder === 'asc' ? 'desc' : 'asc'

  const params = new URLSearchParams(searchParams.toString())
  params.set('sort', columnKey)
  params.set('order', nextOrder)
  const href = `${pathname}?${params.toString()}`

  return (
    <Link
      href={href}
      className="d-flex align-items-center gap-xs sort-header-link"
      style={{ color: 'inherit', textDecoration: 'none', userSelect: 'none' }}
    >
      <span>{label}</span>
      <span
        className="sort-icon"
        style={{ fontSize: '0.7rem', opacity: isActive ? 1 : 0.3 }}
        aria-hidden="true"
      >
        {isActive ? (currentOrder === 'asc' ? '▲' : '▼') : '▲▼'}
      </span>
    </Link>
  )
}
