'use client'

import React from 'react'

interface PageContentProps {
  children: React.ReactNode
  className?: string
  isLoading?: boolean
  loadingComponent?: React.ReactNode
}

export function PageContent({ 
  children, 
  className = '',
  isLoading = false,
  loadingComponent = null
}: PageContentProps) {
  return (
    <div className={`page-content ${className}`}>
      {isLoading && loadingComponent ? loadingComponent : children}
    </div>
  )
}

export default PageContent 