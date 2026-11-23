"use client";

import { useTranslations } from "next-intl";
import { Package, FileText, Users, Box, FolderOpen } from "lucide-react";
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
  physicalCollectionsCount?: number;
  isLoadingPhysicalCollectionsCount?: boolean;

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
  physicalCollectionsCount = 0,
  isLoadingPhysicalCollectionsCount = false,
  visibleArtistsCount = 0,
  isLoadingArtistsCount = false,
  isAdmin = false,
}: DashboardStatsProps) {
  const t = useTranslations("dashboard");

  // Masquer les MetricCard liés à la Marketplace en production (Vercel)
  const isProduction = process.env.NODE_ENV === "production";
  if (isAdmin) {
    return (
      <div className="dashboard-stats">
        <MetricCard
          title={t("admin.artistsCount")}
          value={visibleArtistsCount}
          icon={Users}
          color="#b89c72"
          isLoading={isLoadingArtistsCount}
          buttonTitle={t("quickActions.adminArtists")}
          buttonRoute="/landing/landingArtists"
          index={0}
        />
      </div>
    );
  }

  return (
    <div className="dashboard-stats">
      <MetricCard
        title={t("presale.artworksCount")}
        value={presaleArtworkCount}
        icon={Package}
        color="#b89c72"
        isLoading={isLoadingPresaleCount}
        buttonTitle={t("physical.viewArtworks")}
        buttonRoute="/art/presale-artworks"
        index={0}
      />
      {!isProduction && (
        <>
          <MetricCard
            title={t("physical.availableTitle")}
            value={availablePhysicalItemsCount}
            icon={Box}
            color="#10b981"
            isLoading={isLoadingAvailablePhysicalItemsCount}
            buttonTitle={t("physical.viewArtworks")}
            buttonRoute="/art/myPhysicalArtwork?commercialStatus=AVAILABLE"
        index={1}
          />
          <MetricCard
            title={t("physical.unavailableTitle")}
            value={unavailablePhysicalItemsCount}
            icon={Box}
            color="#f59e0b"
            isLoading={isLoadingUnavailablePhysicalItemsCount}
            buttonTitle={t("physical.viewArtworks")}
            buttonRoute="/art/myPhysicalArtwork?commercialStatus=UNAVAILABLE"
        index={2}
          />
          <MetricCard
            title={t("physical.collectionsTitle")}
            value={physicalCollectionsCount}
            icon={FolderOpen}
            color="#a08659"
            isLoading={isLoadingPhysicalCollectionsCount}
            buttonTitle={t("physical.viewCollections")}
            buttonRoute="/art/physicalCollection"
        index={3}
          />
        </>
      )}
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
