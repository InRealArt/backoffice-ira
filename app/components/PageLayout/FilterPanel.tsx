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
      className={`mb-6 rounded-lg border border-border bg-background-white p-5 ${className}`}
    >
      <header className="mb-4">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-900 dark:text-gray-100">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">{description}</p>
        )}
      </header>
      {children}
    </section>
  )
}

export default FilterPanel
