"use client";

import Image from "next/image";
import { Eye, Heart, ExternalLink, FolderOpen } from "lucide-react";
import NavigationButton from "@/app/components/NavigationButton";
import Badge from "@/app/components/PageLayout/Badge";

export interface PhysicalArtworkListItemProps {
  id: number;
  name: string;
  mainImageUrl: string | null;
  createdAt: string;
  price?: number;
  views?: number;
  wishlistCount?: number;
  collection?: {
    id: number;
    name: string;
  } | null;
  commercialStatus?: "AVAILABLE" | "UNAVAILABLE";
  editHref?: string;
  viewHref?: string;
  onViewClick?: () => void;
  onEditClick?: () => void;
  className?: string;
}

export default function PhysicalArtworkListItem({
  id,
  name,
  mainImageUrl,
  createdAt,
  price,
  views = 0,
  wishlistCount = 0,
  collection,
  commercialStatus,
  editHref,
  viewHref,
  onViewClick,
  onEditClick,
  className,
}: PhysicalArtworkListItemProps) {
  const formatPrice = (priceValue?: number) => {
    if (priceValue === undefined || priceValue === null) return null;
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(priceValue);
  };

  const formatDateFR = (iso?: string) => {
    if (!iso) return "Date inconnue";
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("fr-FR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch {
      return "Date inconnue";
    }
  };

  const displayName = name || "Sans titre";
  const imageUrl = mainImageUrl || "/images/no-image.jpg";
  const formattedPrice = formatPrice(price);
  const formattedDate = formatDateFR(createdAt);
  const displayViews = views || 0;
  const displayWishlist = wishlistCount || 0;

  return (
    <div
      className={`flex items-center justify-between gap-4 p-4 border border-gray-200 rounded-xl bg-white ${
        className || ""
      }`}
    >
      <div className="flex-shrink-0 w-[120px] h-[120px] rounded-lg overflow-hidden bg-gray-200">
        <Image
          src={imageUrl}
          alt={displayName}
          width={120}
          height={120}
          className="w-full h-full object-cover"
          priority
        />
      </div>

      <div className="flex-1 flex flex-col gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="text-lg font-bold text-gray-900">{displayName}</div>
          {commercialStatus && (
            <Badge
              variant={
                commercialStatus === "AVAILABLE" ? "success" : "danger"
              }
              text={commercialStatus === "AVAILABLE" ? "Disponible" : "Indisponible"}
              size="small"
            />
          )}
        </div>
        <div className="text-sm text-gray-500">Créé le {formattedDate}</div>
        {collection && collection.name ? (
          <div className="flex items-center gap-2 text-sm text-indigo-600">
            <FolderOpen size={14} />
            <span className="font-medium">{collection.name}</span>
          </div>
        ) : null}
        {formattedPrice && (
          <div className="text-base font-semibold">{formattedPrice}</div>
        )}
        <div className="flex gap-2.5 mt-1.5">
          {editHref ? (
            <NavigationButton
              href={editHref}
              className="inline-flex items-center gap-2 border border-indigo-600 px-3 py-2 rounded-full bg-indigo-600 text-white font-semibold cursor-pointer transition-colors hover:bg-indigo-700 hover:border-indigo-700"
            >
              Modifier
            </NavigationButton>
          ) : onEditClick ? (
            <button
              type="button"
              onClick={onEditClick}
              className="inline-flex items-center gap-2 border border-indigo-600 px-3 py-2 rounded-full bg-indigo-600 text-white font-semibold cursor-pointer transition-colors hover:bg-indigo-700 hover:border-indigo-700"
            >
              Modifier
            </button>
          ) : null}

          {viewHref ? (
            <NavigationButton
              href={viewHref}
              className="inline-flex items-center gap-2 border border-gray-200 px-3 py-2 rounded-full bg-white text-indigo-600 font-semibold cursor-pointer transition-colors hover:bg-gray-50"
            >
              <ExternalLink size={16} /> Afficher la page
            </NavigationButton>
          ) : onViewClick ? (
            <button
              type="button"
              onClick={onViewClick}
              className="inline-flex items-center gap-2 border border-gray-200 px-3 py-2 rounded-full bg-white text-indigo-600 font-semibold cursor-pointer transition-colors hover:bg-gray-50"
            >
              <ExternalLink size={16} /> Afficher la page
            </button>
          ) : null}
        </div>
      </div>

      <div className="flex-shrink-0 grid grid-flow-row gap-2.5 min-w-[180px]">
        <div className="flex items-center justify-between gap-2.5 text-sm pl-2">
          <span className="flex items-center gap-2">
            <Eye size={16} /> Vues
          </span>
          <span className="text-gray-700 font-semibold">{displayViews}</span>
        </div>
        <div className="flex items-center justify-between gap-2.5 text-sm pl-2">
          <span className="flex items-center gap-2">
            <Heart size={16} /> Wishlist
          </span>
          <span className="text-gray-700 font-semibold">{displayWishlist}</span>
        </div>
      </div>
    </div>
  );
}
