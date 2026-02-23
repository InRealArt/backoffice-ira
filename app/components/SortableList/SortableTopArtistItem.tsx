"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";
import { GripVertical, X } from "lucide-react";
import { getArtistFullName } from "@/lib/utils";

export interface TopArtistSortableItem {
  id: number; // LandingUgcTopArtists.id
  landingArtistId: number;
  order: number;
  landingArtist: {
    id: number;
    imageUrl: string;
    artist: {
      name: string | null;
      surname: string | null;
      pseudo: string | null;
    };
  };
}

interface SortableTopArtistItemProps {
  item: TopArtistSortableItem;
  isDragging: boolean;
  disabled?: boolean;
  onRemove: (landingArtistId: number) => void;
  isRemoving?: boolean;
}

export default function SortableTopArtistItem({
  item,
  isDragging,
  disabled = false,
  onRemove,
  isRemoving = false,
}: SortableTopArtistItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: item.id, disabled: disabled || isRemoving });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.4 : 1,
  };

  const artistName = getArtistFullName(item.landingArtist.artist);
  const pseudo = item.landingArtist.artist.pseudo;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 bg-base-100 border border-base-300 rounded-lg transition-shadow ${
        isDragging ? "shadow-lg ring-2 ring-primary" : "shadow-sm"
      } ${disabled || isRemoving ? "opacity-60" : ""}`}
    >
      {/* Drag handle */}
      <button
        type="button"
        className="cursor-grab active:cursor-grabbing text-base-content/40 hover:text-base-content/70 transition-colors touch-none flex-shrink-0"
        {...attributes}
        {...listeners}
        aria-label="Réordonner"
      >
        <GripVertical size={20} />
      </button>

      {/* Artist image */}
      <div className="relative w-14 h-14 flex-shrink-0 rounded-md overflow-hidden bg-base-200">
        <Image
          src={item.landingArtist.imageUrl}
          alt={artistName}
          fill
          className="object-cover"
          sizes="56px"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-base-content truncate">
          {artistName}
        </p>
        {pseudo && (
          <p className="text-xs text-base-content/60 truncate">{pseudo}</p>
        )}
      </div>

      {/* Order badge */}
      <div className="flex-shrink-0 flex flex-col items-center justify-center w-9 h-9 rounded-full bg-primary text-white font-bold text-sm shadow-sm">
        {item.order}
      </div>

      {/* Remove button */}
      <button
        type="button"
        onClick={() => onRemove(item.landingArtistId)}
        disabled={disabled || isRemoving}
        className="btn btn-ghost btn-sm btn-square text-error hover:bg-error/10 flex-shrink-0"
        aria-label="Retirer des top artistes"
      >
        {isRemoving ? (
          <span className="loading loading-spinner loading-xs" />
        ) : (
          <X size={16} />
        )}
      </button>
    </div>
  );
}
