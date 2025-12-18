"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Artist } from "@prisma/client";
import { ArrowLeft, ArrowUpDown } from "lucide-react";
import { useTranslations } from "next-intl";

// Type pour les artistes du filtre (retourné par getAllArtists)
type FilterArtist = {
  id: number;
  name: string;
  surname: string;
  pseudo: string;
  description: string;
  publicKey: string;
  imageUrl: string;
  isGallery: boolean;
  backgroundImage: string | null;
  idUser: string | null;
};
import Image from "next/image";
import LoadingSpinner from "@/app/components/LoadingSpinner/LoadingSpinner";
import { useToast } from "@/app/components/Toast/ToastContext";
import { deletePresaleArtwork } from "@/lib/actions/presale-artwork-actions";
import { Filters, FilterItem } from "@/app/components/Common";
import { useQueryStates } from "nuqs";
import { presaleArtworksSearchParams } from "./searchParams";
import {
  PageContainer,
  PageHeader,
  PageContent,
  DataTable,
  EmptyState,
  ActionButton,
  DeleteActionButton,
  Column,
} from "../../../components/PageLayout/index";
import styles from "../../../styles/list-components.module.scss";

function ImageThumbnail({ url, alt }: { url: string; alt: string }) {
  return (
    <div className={styles.thumbnailContainer}>
      <Image
        src={url}
        alt={alt}
        fill
        className="object-cover"
        onError={(e) => {
          e.currentTarget.style.display = "none";
        }}
      />
    </div>
  );
}

interface PresaleArtwork {
  id: number;
  name: string;
  order: number;
  displayOrder: number | null;
  price: number | null;
  width: number | null;
  height: number | null;
  artistId: number;
  artist: Artist;
  imageUrl: string;
}

interface PresaleArtworksClientProps {
  presaleArtworks: PresaleArtwork[];
  totalItems: number;
  currentPage: number;
  itemsPerPage: number;
  selectedArtistId: number | null;
  sortColumn: string;
  sortDirection: "asc" | "desc";
  allArtists: FilterArtist[];
  /**
   * Mode artiste : masque les actions admin et adapte les routes
   */
  isArtistMode?: boolean;
  /**
   * Route de base pour l'édition (par défaut: /landing/presaleArtworks)
   */
  editRouteBase?: string;
  /**
   * Route de base pour la création (par défaut: /landing/presaleArtworks)
   */
  createRouteBase?: string;
}

export default function PresaleArtworksClient({
  presaleArtworks,
  totalItems,
  currentPage: initialCurrentPage,
  itemsPerPage: initialItemsPerPage,
  selectedArtistId: initialSelectedArtistId,
  sortColumn: initialSortColumn,
  sortDirection: initialSortDirection,
  allArtists,
  isArtistMode = false,
  editRouteBase = "/landing/presaleArtworks",
  createRouteBase = "/landing/presaleArtworks",
}: PresaleArtworksClientProps) {
  const router = useRouter();
  const [loadingArtworkId, setLoadingArtworkId] = useState<number | null>(null);
  const t = useTranslations("art.presaleArtworks");
  const tCommon = useTranslations("common");

  // Utiliser Nuqs pour gérer les paramètres de recherche
  const [searchParams, setSearchParams] = useQueryStates(
    presaleArtworksSearchParams,
    {
      shallow: false, // Permettre la mise à jour côté serveur
    }
  );

  const { success, error } = useToast();

  const handleArtworkClick = (artwork: PresaleArtwork) => {
    setLoadingArtworkId(artwork.id);
    // Navigation simple vers l'édition - l'historique du navigateur gère le retour
    router.push(`${editRouteBase}/${artwork.id}/edit`);
  };

  const handleAddNewArtwork = () => {
    // Navigation simple vers la création - l'historique du navigateur gère le retour
    // En mode artiste, createRouteBase pointe déjà vers la page complète, sinon on ajoute /create
    const createRoute = isArtistMode
      ? createRouteBase
      : `${createRouteBase}/create`;
    router.push(createRoute);
  };

  const handleBulkAdd = () => {
    // Navigation vers la page d'ajout en masse
    const bulkAddRoute = isArtistMode
      ? "/art/my-artworks/bulk-add"
      : "/landing/presaleArtworks/bulk-add";
    router.push(bulkAddRoute);
  };

  const handleImportExcel = () => {
    // Navigation vers la page d'import Excel
    router.push(`/landing/presaleArtworks/import-excel`);
  };

  const handleDelete = async (artworkId: number): Promise<void> => {
    try {
      // Récupérer les infos de l'œuvre pour supprimer l'image Firebase
      const artwork = presaleArtworks.find(a => a.id === artworkId)
      
      if (!artwork) {
        error(t("errors.artworkNotFound"))
        return
      }

      // Supprimer l'image depuis Firebase Storage (côté client)
      try {
        const { deletePresaleArtworkImage } = await import('@/lib/firebase/storage')
        await deletePresaleArtworkImage(
          artwork.artist.name,
          artwork.artist.surname,
          artwork.name
        )
        console.log('Image Firebase supprimée avec succès')
      } catch (firebaseError) {
        // Ne pas bloquer la suppression si l'image n'existe pas ou ne peut pas être supprimée
        console.warn('Erreur lors de la suppression de l\'image Firebase (non bloquant):', firebaseError)
      }

      // Supprimer l'œuvre de la base de données via la Server Action
      const result = await deletePresaleArtwork(artworkId);

      if (result.success) {
        success(t("errors.deleteSuccess"));

        // Rediriger vers la page de liste appropriée selon le mode
        const listRoute = isArtistMode
          ? "/art/presale-artworks"
          : "/landing/presaleArtworks";

        router.push(listRoute);
      } else {
        error(
          result.message || t("errors.deleteError")
        );
      }
    } catch (err: any) {
      console.error("Erreur lors de la suppression:", err);
      error(t("errors.deleteError"));
    }
  };

  // Formater le prix en euros
  const formatPrice = (price: number | null) => {
    if (price === null) return t("notDefined");
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  // Utiliser la liste complète des artistes passée en props
  const artists = allArtists;

  // Fonction pour gérer le tri
  const handleSort = (column: string) => {
    if (searchParams.sortColumn === column) {
      setSearchParams({
        sortDirection: searchParams.sortDirection === "asc" ? "desc" : "asc",
        page: 1, // Réinitialiser à la première page lors du tri
      });
    } else {
      setSearchParams({
        sortColumn: column,
        sortDirection: "asc",
        page: 1, // Réinitialiser à la première page lors du tri
      });
    }
  };

  // Gestion des changements de pagination
  const handlePageChange = (page: number) => {
    setSearchParams({ page });
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setSearchParams({
      itemsPerPage: newItemsPerPage,
      page: 1, // Réinitialiser à la première page
    });
  };

  // Gestion du changement de filtre artiste
  const handleArtistFilterChange = (value: string) => {
    setSearchParams({
      artistId: value ? parseInt(value) : null,
      page: 1, // Réinitialiser à la première page lors du filtrage
    });
  };

  // Fonction pour formater les dimensions
  const formatDimensions = (width: number | null, height: number | null) => {
    if (!width && !height) return "-";
    if (!width) return `- x ${height} cm`;
    if (!height) return `${width} x - cm`;
    return `${width} x ${height} cm`;
  };

  // Définition des colonnes pour le DataTable
  const columns: Column<PresaleArtwork>[] = [
    {
      key: "imageUrl",
      header: t("columns.image"),
      width: "50px",
      render: (artwork) => <ImageThumbnail url={artwork.imageUrl} alt={t("thumbnail")} />,
    },
    {
      key: "order",
      header: t("columns.order"),
      width: "80px",
      sortable: true,
    },
    {
      key: "displayOrder",
      header: t("columns.displayOrder"),
      width: "120px",
      sortable: !!searchParams.artistId,
      render: (artwork) => artwork.displayOrder ?? "-",
    },
    {
      key: "name",
      header: t("columns.name"),
      sortable: true,
      render: (artwork) => (
        <div className="d-flex align-items-center gap-sm">
          {loadingArtworkId === artwork.id && (
            <LoadingSpinner size="small" message="" inline />
          )}
          <span className={loadingArtworkId === artwork.id ? "text-muted" : ""}>
            {artwork.name}
          </span>
        </div>
      ),
    },
    {
      key: "artist",
      header: t("columns.artist"),
      render: (artwork) => `${artwork.artist.name} ${artwork.artist.surname}`,
    },
    {
      key: "dimensions",
      header: t("columns.dimensions"),
      width: "120px",
      render: (artwork) => formatDimensions(artwork.width, artwork.height),
    },
    {
      key: "price",
      header: t("columns.price"),
      sortable: true,
      render: (artwork) => formatPrice(artwork.price),
    },
    {
      key: "actions",
      header: t("columns.actions"),
      width: "120px",
      render: (artwork) => (
        <DeleteActionButton
          onDelete={() => handleDelete(artwork.id)}
          disabled={loadingArtworkId !== null}
          itemName={t("deleteItemName", { name: artwork.name })}
          confirmMessage={t("deleteConfirm", { name: artwork.name })}
        />
      ),
    },
  ];

  return (
    <PageContainer>
      <PageHeader
        title={isArtistMode ? t("title") : t("titleAdmin")}
        subtitle={
          isArtistMode
            ? t("subtitle")
            : t("subtitleAdmin")
        }
        actions={
          <div className="d-flex gap-sm">
            {isArtistMode && (
              <ActionButton
                label={t("displayOrder")}
                onClick={() => router.push("/art/my-artworks/display-order")}
                size="small"
                variant="secondary"
                icon={<ArrowUpDown size={16} />}
              />
            )}
            {!isArtistMode && searchParams.artistId && (
              <ActionButton
                label={t("displayOrderWebsite")}
                onClick={() => router.push(`/landing/presaleArtworks/display-order?artistId=${searchParams.artistId}`)}
                size="small"
                variant="secondary"
                icon={<ArrowUpDown size={16} />}
              />
            )}
            {!isArtistMode && (
              <ActionButton
                label={t("importByExcel")}
                onClick={handleImportExcel}
                size="small"
                variant="secondary"
              />
            )}
            <ActionButton
              label={t("bulkAdd")}
              onClick={handleBulkAdd}
              size="small"
              variant="secondary"
            />
            <ActionButton
              label={t("addArtwork")}
              onClick={handleAddNewArtwork}
              size="small"
            />
          </div>
        }
      />

      {!isArtistMode && allArtists.length > 0 && (
        <Filters>
          <FilterItem
            id="artistFilter"
            label={t("filterByArtist")}
            value={
              searchParams.artistId ? searchParams.artistId.toString() : ""
            }
            onChange={handleArtistFilterChange}
            options={[
              { value: "", label: t("allArtists") },
              ...artists.map((artist) => ({
                value: artist.id.toString(),
                label: `${artist.name} ${artist.surname}${artist.isGallery ? ` (${t("gallery")})` : ` (${t("artist")})`}`,
              })),
            ]}
          />
        </Filters>
      )}

      <PageContent>
        <DataTable
          data={presaleArtworks}
          columns={columns}
          keyExtractor={(artwork) => artwork.id}
          onRowClick={handleArtworkClick}
          isLoading={false}
          loadingRowId={loadingArtworkId}
          sortColumn={searchParams.sortColumn}
          sortDirection={searchParams.sortDirection}
          onSort={handleSort}
          pagination={{
            enabled: true,
            currentPage: searchParams.page,
            itemsPerPage: searchParams.itemsPerPage,
            totalItems: totalItems,
            onPageChange: handlePageChange,
            onItemsPerPageChange: handleItemsPerPageChange,
            showItemsPerPage: true,
            itemsPerPageOptions: [10, 25, 50, 100],
          }}
          emptyState={<EmptyState message={t("emptyState")} />}
        />
      </PageContent>
    </PageContainer>
  );
}
