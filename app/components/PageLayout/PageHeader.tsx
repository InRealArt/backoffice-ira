'use client'

import React from 'react'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ 
  title, 
  subtitle, 
  actions,
  className = '' 
}: PageHeaderProps) {
  return (
    <div className={`mb-xxl ${className}`}>
      <div className="flex justify-between items-center mb-sm flex-col sm:flex-row sm:items-center gap-md sm:gap-0">
        <h1 className="text-xl font-semibold mb-sm text-text-primary">{title}</h1>
        {actions && (
          <div className="header-actions">
            {actions}
          </div>
        )}
      </div>
      {subtitle && (
        <p className="text-text-secondary text-sm">
          {subtitle}
        </p>
      )}
    </div>
  )
}

export default PageHeader 