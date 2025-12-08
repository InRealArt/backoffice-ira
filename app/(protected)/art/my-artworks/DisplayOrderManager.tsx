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
import Modal from "@/app/components/Common/Modal";
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
  backUrl?: string;
  revalidatePaths?: string[];
}

export default function DisplayOrderManager({
  artworks: initialArtworks,
  artistId,
  backUrl = "/art/my-artworks",
  revalidatePaths,
}: DisplayOrderManagerProps) {
  const router = useRouter();
  const [artworks, setArtworks] = useState<PresaleArtwork[]>(initialArtworks);
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
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

    const pathsToRevalidate = revalidatePaths || [
      "/art/my-artworks",
      "/art/my-artworks/display-order",
      "/art/presale-artworks",
    ];

    try {
      const result = await updateDisplayOrder("presaleArtwork", updates, pathsToRevalidate);

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

  const handleResetClick = () => {
    setIsResetModalOpen(true);
  };

  const handleResetConfirm = async () => {
    setIsResetModalOpen(false);
    setIsResetting(true);

    const pathsToRevalidate = revalidatePaths || [
      "/art/my-artworks",
      "/art/my-artworks/display-order",
      "/art/presale-artworks",
    ];

    try {
      const result = await resetDisplayOrderForArtist(artistId, pathsToRevalidate);

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

  const handleResetCancel = () => {
    setIsResetModalOpen(false);
  };

  return (
    <div className={styles.displayOrderManager}>
      <div className={styles.header}>
        <div className={styles.titleSection}>
          <div className={styles.titleRow}>
            <button
              type="button"
              onClick={() => router.push(backUrl)}
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
            onClick={handleResetClick}
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

      <Modal
        isOpen={isResetModalOpen}
        onClose={handleResetCancel}
        title="Réinitialiser l'ordre d'affichage"
      >
        <div className="flex flex-col gap-4">
          <p className="text-base leading-relaxed">
            Êtes-vous sûr de vouloir réinitialiser l'ordre d'affichage ? L'ordre
            actuel sera perdu.
          </p>

          <div className="flex justify-end gap-3 mt-2 pt-4 border-t border-gray-200">
            <button
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={handleResetCancel}
              disabled={isResetting}
            >
              Annuler
            </button>
            <button
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={handleResetConfirm}
              disabled={isResetting}
            >
              {isResetting ? "Réinitialisation..." : "Confirmer"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
