"use client"

import { useMemo } from "react"
import { PlusCircle } from "lucide-react"
import styles from "./MyPhysicalArtwork.module.scss"
import NavigationButton from "@/app/components/NavigationButton"
import { PhysicalArtworkListItem } from "@/app/components/PhysicalArtwork"
import { Filters, FilterItem } from "@/app/components/Common"
import { useQueryStates } from "nuqs"
import { myPhysicalArtworkSearchParams } from "./searchParams"
import { ItemData } from "@/app/utils/items/itemsData"
import { PhysicalCollection } from "@/lib/actions/physical-collection-actions"

type BackofficeUserResult = {
  id: string
  name: string | null
  email: string
  artistId: number | null
}

interface MyPhysicalArtworkClientProps {
  itemsData: ItemData[]
  userDB: BackofficeUserResult
  allCollections: PhysicalCollection[]
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
  )

  // Filtrer les items par collection
  const filteredItems = useMemo(() => {
    if (!searchParams.collectionId) {
      return itemsData
    }

    return itemsData.filter(
      (item) =>
        item.physicalItem?.physicalCollection?.id === searchParams.collectionId
    )
  }, [itemsData, searchParams.collectionId])

  // Gestion du changement de filtre collection
  const handleCollectionFilterChange = (value: string) => {
    setSearchParams({
      collectionId: value ? parseInt(value) : null,
    })
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className={`page-title ${styles.bigTitle}`}>Mon portfolio</h1>
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
            {searchParams.collectionId
              ? "Aucune œuvre physique trouvée dans cette collection"
              : "Aucune œuvre physique trouvée dans votre collection"}
          </p>
          {!searchParams.collectionId && (
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
          {allCollections.length > 0 && (
            <Filters>
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
            </Filters>
          )}

          <div className="section">
            <div className={styles.listContainer}>
              {filteredItems.map((item) => {
                const views =
                  (item.physicalItem?.realViewCount || 0) +
                  (item.physicalItem?.fakeViewCount || 0)
                const wishlist = 47 // Fallback hardcodé
                const collection = item.physicalItem?.physicalCollection || null

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
                    editHref={`/art/editPhysicalArtwork/${item.id}`}
                  />
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

