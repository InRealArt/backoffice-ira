'use client'

import { ReactNode } from 'react'

interface DashboardCardProps {
  title: string
  children: ReactNode
  icon?: ReactNode
  description?: string
}

export function DashboardCard({ title, children, icon, description }: DashboardCardProps) {
  return (
    <div className="dashboard-card">
      <div className="dashboard-card-header">
        {icon && <div className="dashboard-card-icon">{icon}</div>}
        <div className="dashboard-card-title-wrapper">
          <h3 className="dashboard-card-title">{title}</h3>
          {description && <p className="dashboard-card-description">{description}</p>}
        </div>
      </div>
      <div className="dashboard-card-content">
        {children}
      </div>
    </div>
  )
} 