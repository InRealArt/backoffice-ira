"use client";

import Image from "next/image";
import Link from "next/link";
import { PhysicalCollectionWithItems } from "@/lib/actions/physical-collection-actions";
import { useState } from "react";
import NavigationButton from "@/app/components/NavigationButton";
import { Pencil } from "lucide-react";

interface PhysicalCollectionsListProps {
  collections: PhysicalCollectionWithItems[];
}

// Composant pour afficher une miniature d'œuvre
function ArtworkThumbnail({
  imageUrl,
  alt,
  isSold = false,
  artworkId,
}: {
  imageUrl: string | null;
  alt: string;
  isSold?: boolean;
  artworkId: number;
}) {
  const [imageError, setImageError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const hasValidImage = imageUrl && !imageError;

  return (
    <Link
      href={`/art/editPhysicalArtwork/${artworkId}`}
      className="relative w-[90px] h-[90px] md:w-[80px] md:h-[80px] rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 cursor-pointer transition-transform hover:scale-105 flex-shrink-0 block"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {hasValidImage ? (
        <>
          <Image
            src={imageUrl}
            alt={alt}
            width={90}
            height={90}
            className={`w-full h-full object-cover transition-all duration-200 ${
              isHovered ? "grayscale brightness-75" : ""
            }`}
            loading="lazy"
            onError={() => setImageError(true)}
            quality={85}
          />
        </>
      ) : (
        // Placeholder SVG si pas d'image ou erreur
        <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-gray-700">
          <svg
            className="w-12 h-12 text-gray-400 dark:text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}
      {isSold && (
        <div className="absolute top-2 right-2 w-3 h-3 bg-red-500 rounded-full border-2 border-white shadow-md z-20" />
      )}
      {/* Overlay au hover pour améliorer l'UX */}
      <div
        className={`absolute inset-0 bg-black/0 transition-colors duration-200 pointer-events-none z-[1] ${
          isHovered ? "bg-black/40" : ""
        }`}
      />
      {/* Icône d'édition au survol */}
      <div
        className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 pointer-events-none z-[2] ${
          isHovered ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="bg-white dark:bg-gray-800 rounded-full p-2.5 shadow-2xl border-2 border-white/50 dark:border-gray-700/50 ring-2 ring-purple-500/30 dark:ring-purple-400/30">
          <Pencil
            size={20}
            className="text-purple-600 dark:text-purple-400"
            strokeWidth={3}
          />
        </div>
      </div>
    </Link>
  );
}

export default function PhysicalCollectionsList({
  collections,
}: PhysicalCollectionsListProps) {
  return (
    <div className="grid grid-cols-1 gap-8 mt-6">
      {collections.map((collection) => {
        const onlineItems = collection.physicalItems.filter(
          (item) => item.isOnline
        );
        const soldItems = collection.physicalItems.filter(
          (item) => item.status === "sold"
        );
        const offlineItems = collection.physicalItems.filter(
          (item) => !item.isOnline
        );

        return (
          <div
            key={collection.id}
            className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.05),0_4px_12px_rgba(0,0,0,0.04),0_0_0_1px_rgba(0,0,0,0.02)] border border-gray-200/80 dark:border-gray-700/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_4px_6px_rgba(0,0,0,0.07),0_10px_24px_rgba(0,0,0,0.08),0_0_0_1px_rgba(59,130,246,0.1)] hover:border-blue-200 dark:hover:border-blue-400/40 relative group"
          >
            {/* Bandeau de gradient en haut au hover */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

            {/* Header de la collection */}
            <div className="flex items-center justify-between gap-4 p-7 px-8 border-b border-purple-200/50 dark:border-purple-700/40 collection-header-bg">
              <div className="flex items-center gap-4 flex-1 min-w-0">
                {/* Icon avec gradient comme dans le dashboard */}
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white flex-shrink-0 shadow-[0_4px_12px_rgba(59,130,246,0.3)]">
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18M9 3v18" />
                  </svg>
                </div>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <h2 className="text-[1.375rem] font-bold m-0 text-gray-900 dark:text-gray-50 leading-tight tracking-tight truncate">
                    {collection.name}
                  </h2>
                  <Link
                    href={`/art/edit-physical-collection/${collection.id}`}
                    className="bg-transparent border-none text-gray-500 dark:text-gray-400 cursor-pointer p-1.5 flex items-center justify-center rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-300 flex-shrink-0"
                    aria-label="Modifier la collection"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </Link>
                </div>
              </div>
              {/* Bouton "Ajouter une œuvre" au même niveau que le nom */}
              <div className="flex items-center flex-shrink-0">
                <NavigationButton
                  href={`/art/createPhysicalArtwork?collectionId=${collection.id}`}
                  className="flex items-center gap-2 bg-purple text-white border border-white px-4 py-2 rounded-md cursor-pointer text-sm font-medium transition-all duration-200 hover:bg-purple/90 [&_svg]:shrink-0"
                  aria-label="Ajouter une œuvre"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Ajouter une œuvre
                </NavigationButton>
              </div>
            </div>

            {/* Contenu de la collection */}
            <div className="p-6 px-7">
              {/* Section œuvres online */}
              {onlineItems.length > 0 && (
                <div className="mb-8 last:mb-0">
                  <h3 className="text-base font-semibold mb-4 text-gray-900 dark:text-gray-100">
                    Œuvres présentées sur SINGULART actuellement (
                    {soldItems.length} vendues)
                  </h3>
                  <div className="flex flex-wrap gap-4 md:gap-3">
                    {onlineItems.map((physicalItem) => (
                      <ArtworkThumbnail
                        key={String(physicalItem.id)}
                        imageUrl={physicalItem.item.mainImageUrl}
                        alt={physicalItem.item.name}
                        isSold={physicalItem.status === "sold"}
                        artworkId={physicalItem.item.id}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Section œuvres offline */}
              {offlineItems.length > 0 && (
                <div className="mb-8 last:mb-0">
                  <h3 className="text-base font-semibold mb-4 text-gray-900 dark:text-gray-100">
                    Œuvres offline actuellement ({offlineItems.length} œuvres)
                  </h3>
                  <div className="flex flex-wrap gap-4 md:gap-3">
                    {offlineItems.map((physicalItem) => (
                      <ArtworkThumbnail
                        key={String(physicalItem.id)}
                        imageUrl={physicalItem.item.mainImageUrl}
                        alt={physicalItem.item.name}
                        artworkId={physicalItem.item.id}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Message si aucune œuvre */}
              {collection.physicalItems.length === 0 && (
                <div className="text-center py-12 px-4 text-gray-500 dark:text-gray-400">
                  <p>Aucune œuvre dans cette collection</p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
