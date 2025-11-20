'use client'

import { Package, FileText } from 'lucide-react'
import { MetricCard } from './MetricCard'

interface DashboardStatsProps {
  // Métriques pour les artistes
  presaleArtworkCount?: number
  isLoadingPresaleCount?: boolean
  mintedItemsCount?: number
  isLoadingMintedCount?: boolean
  listedItemsCount?: number
  isLoadingListedCount?: boolean
  
  // Métriques pour les admins
  pendingItemsCount?: number
  isLoadingPendingCount?: boolean
  
  isAdmin?: boolean
}

export function DashboardStats({
  presaleArtworkCount = 0,
  isLoadingPresaleCount = false,
  mintedItemsCount = 0,
  isLoadingMintedCount = false,
  listedItemsCount = 0,
  isLoadingListedCount = false,
  pendingItemsCount = 0,
  isLoadingPendingCount = false,
  isAdmin = false
}: DashboardStatsProps) {
  if (isAdmin) {
    return (
      <div className="dashboard-stats">
        <MetricCard
          title="Items en attente"
          value={pendingItemsCount}
          icon={FileText}
          color="#f59e0b"
          isLoading={isLoadingPendingCount}
        />
      </div>
    )
  }

  return (
    <div className="dashboard-stats">
      <MetricCard
        title="Œuvres en prévente"
        value={presaleArtworkCount}
        icon={Package}
        color="#3b82f6"
        isLoading={isLoadingPresaleCount}
      />
    </div>
  )
}

