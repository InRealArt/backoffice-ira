"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  PageContainer,
  PageHeader,
  PageContent,
  DataTable,
  EmptyState,
  Badge,
  Column,
  ActionButton,
  FilterPanel,
} from "../../../components/PageLayout/index";
import { updateLandingArtistOnboardingBo } from "@/lib/actions/landing-artist-actions";
import { InventoryFilter } from "./InventoryFilter";
import type { ArtistWithCount } from "@/lib/types/artist";
import { getArtistFullName } from "@/lib/utils";
import { getImageUrl } from "@/lib/r2/url";
import { useToast } from "@/app/components/Toast/ToastContext";

interface InventoryClientProps {
  artists: ArtistWithCount[];
}

export default function InventoryClient({ artists }: InventoryClientProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [updatingIds, setUpdatingIds] = useState<Set<number>>(new Set());
  const [isGeneratingExcel, setIsGeneratingExcel] = useState(false);
  const [isGeneratingSelfAddedExcel, setIsGeneratingSelfAddedExcel] =
    useState(false);
  const router = useRouter();
  const toast = useToast();

  // Détecte si l'écran est de taille mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  const handleDateChange = async (
    artist: ArtistWithCount,
    dateValue: string
  ) => {
    if (!artist.landingArtistId) {
      toast.warning("Cet artiste n'a pas de profil LandingArtist associé");
      return;
    }

    setUpdatingIds((prev) => new Set(prev).add(artist.id));

    // Convertir la valeur datetime-local en Date
    // datetime-local retourne "YYYY-MM-DDTHH:mm" (sans timezone)
    // new Date() l'interprète comme étant dans le timezone local
    const date = dateValue ? new Date(dateValue) : null;

    try {
      const result = await updateLandingArtistOnboardingBo(
        artist.landingArtistId,
        date
      );

      if (result.success) {
        toast.success("Date d'onboarding mise à jour");
        router.refresh();
      } else {
        toast.error(result.message || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
      toast.error("Une erreur est survenue");
    } finally {
      setUpdatingIds((prev) => {
        const newSet = new Set(prev);
        newSet.delete(artist.id);
        return newSet;
      });
    }
  };

  const formatDate = (date: Date | null): string => {
    if (!date) return "";
    const d = new Date(date);
    // Formater pour datetime-local avec secondes (YYYY-MM-DDTHH:mm:ss)
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hours = String(d.getHours()).padStart(2, "0");
    const minutes = String(d.getMinutes()).padStart(2, "0");
    const seconds = String(d.getSeconds()).padStart(2, "0");
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };

  const handleGenerateExcel = async () => {
    setIsGeneratingExcel(true);
    try {
      const response = await fetch("/api/inventory/export");

      if (!response.ok) {
        throw new Error("Erreur lors de la génération du fichier Excel");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const filename = `inventaire-total-${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Erreur lors de la génération de l'Excel:", error);
      toast.error("Une erreur est survenue lors de la génération du fichier Excel");
    } finally {
      setIsGeneratingExcel(false);
    }
  };

  const handleGenerateSelfAddedExcel = async () => {
    setIsGeneratingSelfAddedExcel(true);
    try {
      const response = await fetch("/api/inventory/export-self-added");

      if (!response.ok) {
        throw new Error("Erreur lors de la génération du fichier Excel");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const filename = `inventaire-oeuvres-artistes-${
        new Date().toISOString().split("T")[0]
      }.xlsx`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Erreur lors de la génération de l'Excel:", error);
      toast.error("Une erreur est survenue lors de la génération du fichier Excel");
    } finally {
      setIsGeneratingSelfAddedExcel(false);
    }
  };

  // Définition des colonnes pour le DataTable
  const columns: Column<ArtistWithCount>[] = [
    {
      key: "name",
      header: "Artiste",
      width: "200px",
      render: (artist) => (
        <div className="d-flex align-items-center gap-sm">
          <div className="avatar">
            <div className="mask mask-squircle w-10 h-10">
              <img
                src={getImageUrl(artist.imageUrl) ?? undefined}
                alt={getArtistFullName(artist)}
              />
            </div>
          </div>
          <span>
            {getArtistFullName(artist)}
          </span>
        </div>
      ),
    },
    {
      key: "presaleArtworkCount",
      header: "Nombre d'œuvres en prévente",
      width: "200px",
      render: (artist) => (
        <Badge variant="primary" text={artist.presaleArtworkCount.toString()} />
      ),
    },
    {
      key: "onboardingBo",
      header: "Date d'onboarding",
      width: "350px",
      render: (artist) => {
        const isUpdating = updatingIds.has(artist.id);
        const hasLandingArtist = artist.landingArtistId !== null;

        if (!hasLandingArtist) {
          return (
            <span className="text-base-content/50 text-sm">
              Pas de profil LandingArtist
            </span>
          );
        }

        return (
          <div className="flex items-center gap-2">
            <input
              type="datetime-local"
              value={formatDate(artist.onboardingBo)}
              onChange={(e) => handleDateChange(artist, e.target.value)}
              disabled={isUpdating}
              className="input input-bordered input-sm w-full max-w-xs"
              step="1"
            />
          </div>
        );
      },
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title="Inventaire site web"
        subtitle="Liste des artistes avec le nombre d'œuvres en prévente"
        actions={
          <div className="flex gap-2">
            <ActionButton
              label="Générer inventaire total"
              onClick={handleGenerateExcel}
              isLoading={isGeneratingExcel}
              variant="primary"
              size="medium"
            />
            <ActionButton
              label="Générer inventaire œuvres artistes"
              onClick={handleGenerateSelfAddedExcel}
              isLoading={isGeneratingSelfAddedExcel}
              variant="secondary"
              size="medium"
            />
          </div>
        }
      />
      <PageContent>
        <FilterPanel title="Filtrer les artistes" description="Recherchez par nom ou prénom">
          <InventoryFilter />
        </FilterPanel>
        <DataTable
          data={artists}
          columns={columns}
          keyExtractor={(artist) => artist.id}
          isLoading={false}
          emptyState={<EmptyState message="Aucun artiste trouvé" />}
        />
      </PageContent>
    </PageContainer>
  );
}
