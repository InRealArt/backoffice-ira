'use client'

import React from 'react'

interface FilterPanelProps {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}

/**
 * Bloc de filtres commun aux listes du backoffice.
 * Style sobre (fond plat, bordure fine) pour rester cohérent avec les tokens du thème.
 */
export function FilterPanel({
  title,
  description,
  children,
  className = ''
}: FilterPanelProps) {
  return (
    <section
      aria-label={title}
      className={`filter-panel mb-6 border border-border bg-background-white p-5 ${className}`}
    >
      <header className="mb-4">
        <h2 className="filter-panel-title">
          {title}
        </h2>
        {description && (
          <p className="filter-panel-description">{description}</p>
        )}
      </header>
      {children}
    </section>
  )
}

export default FilterPanel
