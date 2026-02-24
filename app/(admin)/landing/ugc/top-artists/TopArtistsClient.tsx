"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Star, UserCheck, Plus } from "lucide-react";
import { useToast } from "@/app/components/Toast/ToastContext";
import { SortableList } from "@/app/components/SortableList";
import SortableTopArtistItem, {
  type TopArtistSortableItem,
} from "@/app/components/SortableList/SortableTopArtistItem";
import {
  addTopArtist,
  removeTopArtist,
  updateTopArtistsOrder,
} from "@/lib/actions/landing-ugc-actions";
import { getArtistFullName } from "@/lib/utils";

interface AvailableUgcProfile {
  id: number;
  profileImageUrl: string | null;
  name: string | null;
  surname: string | null;
  pseudo: string | null;
}

interface TopArtistsClientProps {
  initialTopArtists: TopArtistSortableItem[];
  availableProfiles: AvailableUgcProfile[];
}

export default function TopArtistsClient({
  initialTopArtists,
  availableProfiles: initialAvailable,
}: TopArtistsClientProps) {
  const [topArtists, setTopArtists] =
    useState<TopArtistSortableItem[]>(initialTopArtists);
  const [available, setAvailable] =
    useState<AvailableUgcProfile[]>(initialAvailable);
  const [removingId, setRemovingId] = useState<number | null>(null);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [isSaving, startSavingTransition] = useTransition();
  const { success, error } = useToast();

  // ── Drag & drop reorder ────────────────────────────────────────────────────
  const handleReorder = async (
    reorderedItems: TopArtistSortableItem[]
  ): Promise<void> => {
    // Optimistic update
    const withNewOrder = reorderedItems.map((item, idx) => ({
      ...item,
      order: idx + 1,
    }));
    setTopArtists(withNewOrder);

    // Ne mettre à jour en base que les entrées déjà persistées (id > 0).
    // Les id temporaires sont négatifs (ex. -ugcArtistProfileId) pour les ajouts récents.
    const updates = withNewOrder
      .filter((item) => item.id > 0)
      .map((item) => ({
        id: item.id,
        order: item.order,
      }));

    startSavingTransition(async () => {
      if (updates.length === 0) return
      const result = await updateTopArtistsOrder(updates)
      if (result.success) {
        success("Ordre mis à jour")
      } else {
        error(result.message ?? "Erreur lors de la mise à jour")
        setTopArtists(initialTopArtists) // rollback
      }
    })
  }

  // ── Add ───────────────────────────────────────────────────────────────────
  const handleAdd = async (profile: AvailableUgcProfile) => {
    setAddingId(profile.id);
    const result = await addTopArtist(profile.id);
    if (result.success) {
      const nextOrder = topArtists.length + 1;
      const newItem: TopArtistSortableItem = {
        id: -profile.id, // id temporaire (négatif), vrai id après rechargement
        ugcArtistProfileId: profile.id,
        order: nextOrder,
        ugcArtistProfile: {
          id: profile.id,
          profileImageUrl: profile.profileImageUrl,
          name: profile.name,
          surname: profile.surname,
          pseudo: profile.pseudo,
        },
      };
      setTopArtists((prev) => [...prev, newItem]);
      setAvailable((prev) => prev.filter((p) => p.id !== profile.id));
      success(
        `${getArtistFullName(profile)} ajouté aux top artistes`
      );
    } else {
      error(result.message ?? "Erreur lors de l'ajout");
    }
    setAddingId(null);
  };

  // ── Remove ────────────────────────────────────────────────────────────────
  const handleRemove = async (ugcArtistProfileId: number) => {
    setRemovingId(ugcArtistProfileId);
    const result = await removeTopArtist(ugcArtistProfileId);
    if (result.success) {
      const removed = topArtists.find(
        (t) => t.ugcArtistProfileId === ugcArtistProfileId
      );
      setTopArtists((prev) =>
        prev
          .filter((t) => t.ugcArtistProfileId !== ugcArtistProfileId)
          .map((t, idx) => ({ ...t, order: idx + 1 }))
      );
      if (removed) {
        setAvailable((prev) =>
          [
            ...prev,
            {
              id: removed.ugcArtistProfileId,
              profileImageUrl: removed.ugcArtistProfile.profileImageUrl,
              name: removed.ugcArtistProfile.name,
              surname: removed.ugcArtistProfile.surname,
              pseudo: removed.ugcArtistProfile.pseudo,
            },
          ].sort((a, b) =>
            getArtistFullName(a).localeCompare(getArtistFullName(b))
          )
        );
        success(
          `${getArtistFullName(removed.ugcArtistProfile)} retiré`
        );
      }
    } else {
      error(result.message ?? "Erreur lors de la suppression");
    }
    setRemovingId(null);
  };

  return (
    <div className="page-container max-w-4xl mx-auto py-8 px-4 flex flex-col gap-10">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Star size={22} className="text-primary" />
          <h1 className="text-2xl font-bold">Top Artistes UGC</h1>
        </div>
        <p className="text-base-content/60 text-sm">
          Sélectionnez et ordonnez les artistes mis en avant dans la section UGC
          du site. Glissez-déposez pour réordonner.
        </p>
      </div>

      {/* Section 1 : artistes sélectionnés */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <UserCheck size={18} className="text-success" />
            Top artistes sélectionnés
            <span className="badge badge-success badge-sm">
              {topArtists.length}
            </span>
          </h2>
          {isSaving && (
            <span className="flex items-center gap-1 text-xs text-base-content/50">
              <span className="loading loading-spinner loading-xs" />
              Enregistrement…
            </span>
          )}
        </div>

        {topArtists.length === 0 ? (
          <div className="border-2 border-dashed border-base-300 rounded-xl p-10 text-center text-base-content/40">
            <Star size={32} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Aucun top artiste sélectionné</p>
            <p className="text-xs mt-1">
              Ajoutez des artistes depuis la liste ci-dessous
            </p>
          </div>
        ) : (
          <SortableList
            items={topArtists}
            onReorder={handleReorder}
            disabled={isSaving || removingId !== null}
            emptyMessage="Aucun top artiste sélectionné"
            renderItem={(item, _index, isDragging) => (
              <SortableTopArtistItem
                item={item}
                isDragging={isDragging}
                disabled={isSaving || removingId !== null}
                onRemove={handleRemove}
                isRemoving={removingId === item.ugcArtistProfileId}
              />
            )}
          />
        )}
      </section>

      <div className="divider" />

      {/* Section 2 : profils UGC disponibles */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Plus size={18} className="text-primary" />
            Profils UGC disponibles
          </h2>
          <span className="inline-flex items-center justify-center min-w-[2rem] h-7 px-2 rounded-full bg-primary/10 text-primary text-sm font-bold border border-primary/20">
            {available.length}
          </span>
        </div>

        {available.length === 0 ? (
          <div className="border-2 border-dashed border-base-300 rounded-xl p-10 text-center text-base-content/40">
            <p className="text-sm">Tous les profils UGC sont sélectionnés</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {available.map((profile) => {
              const name = getArtistFullName(profile);
              const pseudo = profile.pseudo;
              const isAdding = addingId === profile.id;
              return (
                <li
                  key={profile.id}
                  className="flex items-center gap-3 p-3 bg-base-100 border border-base-300 rounded-lg shadow-sm"
                >
                  {/* Image */}
                  <div className="relative w-14 h-14 flex-shrink-0 rounded-md overflow-hidden bg-base-200">
                    {profile.profileImageUrl ? (
                      <Image
                        src={profile.profileImageUrl}
                        alt={name}
                        fill
                        className="object-cover"
                        sizes="56px"
                        onError={(e) => {
                          e.currentTarget.style.display = "none";
                        }}
                      />
                    ) : null}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-base-content truncate">
                      {name}
                    </p>
                    {pseudo && (
                      <p className="text-xs text-base-content/60 truncate">
                        {pseudo}
                      </p>
                    )}
                  </div>

                  {/* Add button */}
                  <button
                    type="button"
                    onClick={() => handleAdd(profile)}
                    disabled={isAdding || addingId !== null || removingId !== null}
                    className="btn btn-primary btn-small flex-shrink-0"
                  >
                    {isAdding ? (
                      <span className="loading-spinner-inline" />
                    ) : (
                      <span className="btn-icon"><Plus size={14} /></span>
                    )}
                    Ajouter
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
