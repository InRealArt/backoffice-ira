'use client'

import { ReactNode } from 'react'
import styles from './DashboardCard.module.scss'

interface DashboardCardProps {
  title: string
  children: ReactNode
}

export function DashboardCard({ title, children }: DashboardCardProps) {
  return (
    <div className={styles.dashboardCard}>
      <h3>{title}</h3>
      {children}
    </div>
  )
} 