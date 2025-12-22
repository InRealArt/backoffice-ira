"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";
import { GripVertical } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import styles from "./SortableArtworkItem.module.scss";

interface PresaleArtwork {
  id: number;
  name: string;
  imageUrl: string;
  price: number | null;
  width: number | null;
  height: number | null;
  displayOrder: number | null;
  artist?: {
    name: string;
    surname: string;
  };
}

interface SortableArtworkItemProps {
  artwork: PresaleArtwork;
  isDragging: boolean;
  disabled?: boolean;
}

export default function SortableArtworkItem({
  artwork,
  isDragging,
  disabled = false,
}: SortableArtworkItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: artwork.id,
    disabled,
  });

  const t = useTranslations("art.displayOrderPage.manager.artworkItem");
  const params = useParams();
  const locale = (params.locale as string) || "fr";

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  const formatPrice = (price: number | null) => {
    if (price === null) return t("notDefined");
    return new Intl.NumberFormat(locale === "en" ? "en-US" : "fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(price);
  };

  const formatDimensions = (width: number | null, height: number | null) => {
    if (!width && !height) return "-";
    if (!width) return `- x ${height} cm`;
    if (!height) return `${width} x - cm`;
    return `${width} x ${height} cm`;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`${styles.sortableItem} ${isDragging ? styles.dragging : ""} ${
        disabled ? styles.disabled : ""
      }`}
    >
      <div className={styles.dragHandle} {...attributes} {...listeners}>
        <GripVertical size={20} />
      </div>

      <div className={styles.thumbnail}>
        <Image
          src={artwork.imageUrl}
          alt={artwork.name}
          fill
          className={styles.image}
          sizes="80px"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </div>

      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.title}>{artwork.name}</h3>
          {artwork.displayOrder !== null && (
            <span className={styles.orderBadge}>
              {t("order")}: {artwork.displayOrder}
            </span>
          )}
        </div>

        <div className={styles.details}>
          {artwork.artist && (
            <div className={styles.detailItem}>
              <span className={styles.label}>{t("artist")}:</span>
              <span className={styles.value}>
                {artwork.artist.name} {artwork.artist.surname}
              </span>
            </div>
          )}

          <div className={styles.detailItem}>
            <span className={styles.label}>{t("dimensions")}:</span>
            <span className={styles.value}>
              {formatDimensions(artwork.width, artwork.height)}
            </span>
          </div>

          <div className={styles.detailItem}>
            <span className={styles.label}>{t("price")}:</span>
            <span className={styles.value}>{formatPrice(artwork.price)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
