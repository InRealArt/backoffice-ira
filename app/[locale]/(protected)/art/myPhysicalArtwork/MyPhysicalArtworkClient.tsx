"use client";

import { useMemo } from "react";
import { PlusCircle } from "lucide-react";
import styles from "./MyPhysicalArtwork.module.scss";
import NavigationButton from "@/app/components/NavigationButton";
import { PhysicalArtworkListItem } from "@/app/components/PhysicalArtwork";
import { Filters, FilterItem } from "@/app/components/Common";
import { useQueryStates } from "nuqs";
import { myPhysicalArtworkSearchParams } from "./searchParams";
import { ItemData } from "@/lib/actions/items-actions";
import { PhysicalCollection } from "@/lib/actions/physical-collection-actions";

type BackofficeUserResult = {
  id: string;
  name: string | null;
  email: string;
  artistId: number | null;
};

interface MyPhysicalArtworkClientProps {
  itemsData: ItemData[];
  userDB: BackofficeUserResult;
  allCollections: PhysicalCollection[];
}

export default function MyPhysicalArtworkClient({
  itemsData,
  userDB,
  allCollections,
}: MyPhysicalArtworkClientProps) {
  // Utiliser Nuqs pour gérer les paramètres de recherche
  const [searchParams, setSearchParams] = useQueryStates(
    myPhysicalArtworkSearchParams,
    {
      shallow: false,
    }
  );

  // Filtrer les items par collection et statut commercial
  const filteredItems = useMemo(() => {
    return itemsData.filter((item) => {
      // Filtre par collection
      if (searchParams.collectionId) {
        if (
          item.physicalItem?.physicalCollection?.id !==
          searchParams.collectionId
        ) {
          return false;
        }
      }

      // Filtre par statut commercial
      if (searchParams.commercialStatus) {
        const itemCommercialStatus =
          item.physicalItem?.commercialStatus || "AVAILABLE";
        if (itemCommercialStatus !== searchParams.commercialStatus) {
          return false;
        }
      }

      return true;
    });
  }, [itemsData, searchParams.collectionId, searchParams.commercialStatus]);

  // Gestion du changement de filtre collection
  const handleCollectionFilterChange = (value: string) => {
    setSearchParams({
      collectionId: value ? parseInt(value) : null,
    });
  };

  // Gestion du changement de filtre statut commercial
  const handleCommercialStatusFilterChange = (value: string) => {
    setSearchParams({
      commercialStatus:
        value === "AVAILABLE" || value === "UNAVAILABLE" ? value : null,
    });
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className={`page-title ${styles.bigTitle}`}>
            Mon portfolio sur la Marketplace InRealArt
          </h1>
          <NavigationButton
            href="/art/createPhysicalArtwork"
            variant="primary"
            className="px-6 py-2 flex items-center gap-2"
          >
            <PlusCircle size={18} />
            Créer une œuvre physique
          </NavigationButton>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="empty-state">
          <p>
            {(() => {
              const hasCollectionFilter = !!searchParams.collectionId;
              const hasCommercialStatusFilter = !!searchParams.commercialStatus;

              if (hasCollectionFilter && hasCommercialStatusFilter) {
                const statusLabel =
                  searchParams.commercialStatus === "AVAILABLE"
                    ? "disponibles"
                    : "indisponibles";
                return `Aucune œuvre physique ${statusLabel} trouvée dans cette collection`;
              }
              if (hasCollectionFilter) {
                return "Aucune œuvre physique trouvée dans cette collection";
              }
              if (hasCommercialStatusFilter) {
                const statusLabel =
                  searchParams.commercialStatus === "AVAILABLE"
                    ? "disponibles"
                    : "indisponibles";
                return `Aucune œuvre physique ${statusLabel} trouvée dans votre collection`;
              }
              return "Aucune œuvre physique trouvée dans votre collection";
            })()}
          </p>
          {!searchParams.collectionId && !searchParams.commercialStatus && (
            <NavigationButton
              href="/art/createPhysicalArtwork"
              variant="primary"
              className="mt-4 flex items-center gap-2"
            >
              <PlusCircle size={18} />
              Créer votre première œuvre physique
            </NavigationButton>
          )}
        </div>
      ) : (
        <>
          <Filters>
            {allCollections.length > 0 && (
              <FilterItem
                id="collectionFilter"
                label="Filtrer par collection:"
                value={
                  searchParams.collectionId
                    ? searchParams.collectionId.toString()
                    : ""
                }
                onChange={handleCollectionFilterChange}
                options={[
                  { value: "", label: "Toutes les collections" },
                  ...allCollections.map((collection) => ({
                    value: collection.id.toString(),
                    label: collection.name,
                  })),
                ]}
              />
            )}
            <FilterItem
              id="commercialStatusFilter"
              label="Filtrer par statut commercial:"
              value={searchParams.commercialStatus || ""}
              onChange={handleCommercialStatusFilterChange}
              options={[
                { value: "", label: "Tous les statuts" },
                { value: "AVAILABLE", label: "Disponible" },
                { value: "UNAVAILABLE", label: "Indisponible" },
              ]}
            />
          </Filters>

          <div className="section">
            <div className={styles.listContainer}>
              {filteredItems.map((item) => {
                // Utiliser uniquement realViewCount qui contient maintenant le nombre réel depuis PhysicalArtworkView
                const views = item.physicalItem?.realViewCount || 0;
                const wishlist = 47; // Fallback hardcodé
                const collection =
                  item.physicalItem?.physicalCollection || null;

                return (
                  <PhysicalArtworkListItem
                    key={item.id}
                    id={item.id}
                    name={item.name}
                    mainImageUrl={item.mainImageUrl}
                    createdAt={item.createdAt}
                    price={item.physicalItem?.price}
                    views={views}
                    wishlistCount={wishlist}
                    collection={collection}
                    commercialStatus={
                      item.physicalItem?.commercialStatus as
                        | "AVAILABLE"
                        | "UNAVAILABLE"
                        | undefined
                    }
                    editHref={`/art/editPhysicalArtwork/${item.id}`}
                  />
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
