'use client'

import { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: number | string
  icon?: LucideIcon
  color?: string
  isLoading?: boolean
}

export function MetricCard({ title, value, icon: Icon, color = '#3b82f6', isLoading }: MetricCardProps) {
  return (
    <div className="metric-card">
      <div className="metric-card-header">
        {Icon && (
          <div className="metric-icon" style={{ backgroundColor: `${color}15`, color }}>
            <Icon size={24} />
          </div>
        )}
        <h4 className="metric-title">{title}</h4>
      </div>
      <div className="metric-value-container">
        {isLoading ? (
          <div className="metric-loading">
            <div className="metric-loading-bar"></div>
          </div>
        ) : (
          <span className="metric-value" style={{ color }}>
            {typeof value === 'number' ? value.toLocaleString('fr-FR') : value}
          </span>
        )}
      </div>
    </div>
  )
}

