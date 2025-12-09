"use client";

import { Package, FileText, Users, Box } from "lucide-react";
import { MetricCard } from "./MetricCard";

interface DashboardStatsProps {
  // Métriques pour les artistes
  presaleArtworkCount?: number;
  isLoadingPresaleCount?: boolean;
  mintedItemsCount?: number;
  isLoadingMintedCount?: boolean;
  listedItemsCount?: number;
  isLoadingListedCount?: boolean;
  pendingItemsCount?: number;
  isLoadingPendingCount?: boolean;
  physicalItemsCount?: number;
  isLoadingPhysicalItemsCount?: boolean;
  availablePhysicalItemsCount?: number;
  unavailablePhysicalItemsCount?: number;
  isLoadingAvailablePhysicalItemsCount?: boolean;
  isLoadingUnavailablePhysicalItemsCount?: boolean;

  // Métriques pour les admins
  visibleArtistsCount?: number;
  isLoadingArtistsCount?: boolean;

  isAdmin?: boolean;
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
  physicalItemsCount = 0,
  isLoadingPhysicalItemsCount = false,
  availablePhysicalItemsCount = 0,
  unavailablePhysicalItemsCount = 0,
  isLoadingAvailablePhysicalItemsCount = false,
  isLoadingUnavailablePhysicalItemsCount = false,
  visibleArtistsCount = 0,
  isLoadingArtistsCount = false,
  isAdmin = false,
}: DashboardStatsProps) {
  if (isAdmin) {
    return (
      <div className="dashboard-stats">
        <MetricCard
          title="Nb artistes"
          value={visibleArtistsCount}
          icon={Users}
          color="#3b82f6"
          isLoading={isLoadingArtistsCount}
        />
      </div>
    );
  }

  return (
    <div className="dashboard-stats">
      <MetricCard
        title="Œuvres en prévente sur le site web InRealArt"
        value={presaleArtworkCount}
        icon={Package}
        color="#3b82f6"
        isLoading={isLoadingPresaleCount}
        buttonTitle="Voir les œuvres"
        buttonRoute="/art/presale-artworks"
      />
      <MetricCard
        title="Œuvres physiques disponibles sur la Marketplace"
        value={availablePhysicalItemsCount}
        icon={Box}
        color="#10b981"
        isLoading={isLoadingAvailablePhysicalItemsCount}
        buttonTitle="Voir les œuvres"
        buttonRoute="/art/myPhysicalArtwork?commercialStatus=AVAILABLE"
      />
      <MetricCard
        title="Œuvres physiques indisponibles sur la Marketplace"
        value={unavailablePhysicalItemsCount}
        icon={Box}
        color="#f59e0b"
        isLoading={isLoadingUnavailablePhysicalItemsCount}
        buttonTitle="Voir les œuvres"
        buttonRoute="/art/myPhysicalArtwork?commercialStatus=UNAVAILABLE"
      />
      {/* <MetricCard
        title="Items en attente"
        value={pendingItemsCount}
        icon={FileText}
        color="#f59e0b"
        isLoading={isLoadingPendingCount}
      /> */}
    </div>
  );
}
