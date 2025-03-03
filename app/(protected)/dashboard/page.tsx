'use client'

import Dashboard from '@/app/components/Dashboard/Dashboard'
import styles from './dashboard.module.scss'

export default function DashboardPage() {
  return (
    <div className={styles.dashboardContent}>
      <Dashboard />
    </div>
  )
} 