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
    <div className={`page-header ${className}`}>
      <div className="header-top-section">
        <h1 className="page-title">{title}</h1>
        {actions && (
          <div className="header-actions">
            {actions}
          </div>
        )}
      </div>
      {subtitle && (
        <p className="page-subtitle">
          {subtitle}
        </p>
      )}
    </div>
  )
}

export default PageHeader 