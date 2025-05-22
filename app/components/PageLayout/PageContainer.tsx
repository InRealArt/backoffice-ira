'use client'

import React from 'react'

interface PageContainerProps {
  children: React.ReactNode
  className?: string
}

export function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div className={`page-container ${className}`}>
      {children}
    </div>
  )
}

export default PageContainer 