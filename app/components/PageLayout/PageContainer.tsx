'use client'

import React from 'react'

interface PageContainerProps {
  children: React.ReactNode
  className?: string
}

export function PageContainer({ children, className = '' }: PageContainerProps) {
  return (
    <div className={`w-full p-xl bg-background-main rounded-lg shadow-md mx-8 min-h-[calc(100vh-180px)] ${className}`}>
      {children}
    </div>
  )
}

export default PageContainer 