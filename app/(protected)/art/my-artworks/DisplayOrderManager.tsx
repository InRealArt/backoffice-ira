"use client";

import { useState, useEffect } from "react";
import {
  SortableList,
  SortableArtworkItem,
  type SortableItem,
} from "@/app/components/SortableList";
import { updateDisplayOrder } from "@/lib/actions/display-order-actions";
import { useToast } from "@/app/components/Toast/ToastContext";
import { RotateCcw, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { resetDisplayOrderForArtist } from "@/lib/actions/display-order-actions";
import styles from "./DisplayOrderManager.module.scss";

interface PresaleArtwork {
  id: number;
  name: string;
  imageUrl: string;
  price: number | null;
  width: number | null;
  height: number | null;
  displayOrder: number | null;
  artistId: number;
  artist?: {
    name: string;
    surname: string;
  };
}

interface DisplayOrderManagerProps {
  artworks: PresaleArtwork[];
  artistId: number;
}

export default function DisplayOrderManager({
  artworks: initialArtworks,
  artistId,
}: DisplayOrderManagerProps) {
  const router = useRouter();
  const [artworks, setArtworks] = useState<PresaleArtwork[]>(initialArtworks);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const { success, error } = useToast();

  // Trier les œuvres par displayOrder, puis par id
  useEffect(() => {
    const sorted = [...initialArtworks].sort((a, b) => {
      const orderA = a.displayOrder ?? Infinity;
      const orderB = b.displayOrder ?? Infinity;
      if (orderA !== orderB) {
        return orderA - orderB;
      }
      return a.id - b.id;
    });
    setArtworks(sorted);
  }, [initialArtworks]);

  const handleReorder = async (reorderedItems: SortableItem[]) => {
    // Mettre à jour l'état local immédiatement pour un feedback visuel
    setArtworks(reorderedItems as PresaleArtwork[]);

    // Préparer les mises à jour avec les nouveaux displayOrder
    const updates = reorderedItems.map((item, index) => ({
      id: item.id as number,
      displayOrder: index + 1,
    }));

    setIsSaving(true);

    try {
      const result = await updateDisplayOrder("presaleArtwork", updates, [
        "/art/my-artworks",
        "/art/my-artworks/display-order",
        "/art/presale-artworks",
      ]);

      if (result.success) {
        success("Ordre d'affichage mis à jour avec succès");
      } else {
        error(result.message || "Erreur lors de la mise à jour de l'ordre");
        // Restaurer l'ordre précédent en cas d'erreur
        setArtworks(initialArtworks);
      }
    } catch (err) {
      console.error("Erreur lors du réordonnancement:", err);
      error("Une erreur est survenue lors de la mise à jour");
      setArtworks(initialArtworks);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (
      !confirm(
        "Êtes-vous sûr de vouloir réinitialiser l'ordre d'affichage ? L'ordre actuel sera perdu."
      )
    ) {
      return;
    }

    setIsResetting(true);

    try {
      const result = await resetDisplayOrderForArtist(artistId, [
        "/art/my-artworks",
        "/art/my-artworks/display-order",
        "/art/presale-artworks",
      ]);

      if (result.success) {
        success("Ordre d'affichage réinitialisé avec succès");
        // Recharger la page pour afficher le nouvel ordre
        window.location.reload();
      } else {
        error(result.message || "Erreur lors de la réinitialisation");
      }
    } catch (err) {
      console.error("Erreur lors de la réinitialisation:", err);
      error("Une erreur est survenue lors de la réinitialisation");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className={styles.displayOrderManager}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <div className={styles.titleRow}>
            <button
              type="button"
              onClick={() => router.push("/art/my-artworks")}
              className={styles.backButton}
              aria-label="Retour à la liste des œuvres"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className={styles.title}>Ordre d'affichage sur site web</h2>
          </div>
          <p className={styles.subtitle}>
            Réorganisez vos œuvres en les glissant-déposant. Cet ordre sera
            utilisé pour l'affichage sur une autre application.
          </p>
        </div>
        <div className={styles.actions}>
          <button
            type="button"
            onClick={handleReset}
            disabled={isResetting || isSaving}
            className={styles.resetButton}
          >
            <RotateCcw size={16} />
            Réinitialiser
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {artworks.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Aucune œuvre à réordonner</p>
          </div>
        ) : (
          <SortableList
            items={artworks}
            onReorder={handleReorder}
            renderItem={(item, index, isDragging) => (
              <SortableArtworkItem
                artwork={item}
                isDragging={isDragging}
                disabled={isSaving || isResetting}
              />
            )}
            disabled={isSaving || isResetting}
            emptyMessage="Aucune œuvre à afficher"
          />
        )}

        {isSaving && (
          <div className={styles.savingIndicator}>
            <p>Enregistrement de l'ordre...</p>
          </div>
        )}
      </div>
    </div>
  );
}
