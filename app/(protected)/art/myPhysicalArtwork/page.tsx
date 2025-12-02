"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import LoadingSpinner from "@/app/components/LoadingSpinner/LoadingSpinner";
import { fetchItemsData, ItemData } from "@/app/utils/items/itemsData";
import { getBackofficeUserByEmail } from "@/lib/actions/prisma-actions";
import { BackofficeAuthUser } from "@prisma/client";
import Image from "next/image";
import { Eye, Heart, ExternalLink, PlusCircle } from "lucide-react";
import styles from "./MyPhysicalArtwork.module.scss";
import NavigationButton from "@/app/components/NavigationButton";

export default function MyPhysicalArtworkPage() {
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [itemsData, setItemsData] = useState<ItemData[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userDB, setUserDB] = useState<BackofficeAuthUser | null>(null);

  useEffect(() => {
    // Attendre que la session soit chargée
    if (isSessionPending) {
      return;
    }

    // Ne rien faire si l'utilisateur n'est pas connecté
    if (!session?.user?.email) {
      setIsLoading(false);
      setError("Vous devez être connecté pour voir vos œuvres physiques");
      return;
    }

    let isMounted = true;

    // Récupérer les données des items
    const loadData = async () => {
      // Garantir que email n'est jamais undefined
      const email = session.user.email as string;
      const userDB = await getBackofficeUserByEmail(email);

      if (!userDB) {
        setError("Votre profil utilisateur n'a pas été trouvé");
        setIsLoading(false);
        return;
      }

      setUserDB(userDB);

      const result = await fetchItemsData(email);

      if (isMounted) {
        if (!result.success) {
          setError(result.error || null);
        } else {
          // Filtrer uniquement les items qui ont un physicalItem
          const physicalItems = (result.data || []).filter(
            (item) =>
              item.physicalItem !== null && item.physicalItem !== undefined
          );
          setItemsData(physicalItems);
        }
        setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [session?.user?.email, isSessionPending]);

  if (isLoading) {
    return <LoadingSpinner message="Chargement de vos œuvres physiques..." />;
  }

  // Helpers
  const formatPrice = (price?: number) => {
    if (price === undefined || price === null) return null;
    return new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
    }).format(price);
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

      {error ? (
        <div className="alert alert-error">{error}</div>
      ) : !itemsData || itemsData.length === 0 ? (
        <div className="empty-state">
          <p>Aucune œuvre physique trouvée dans votre collection</p>
          <NavigationButton
            href="/art/createPhysicalArtwork"
            variant="primary"
            className="mt-4 flex items-center gap-2"
          >
            <PlusCircle size={18} />
            Créer votre première œuvre physique
          </NavigationButton>
        </div>
      ) : (
        <>
          <div className="section">
            <div className={styles.listContainer}>
              {itemsData.map((item) => {
                const views =
                  (item.physicalItem?.realViewCount || 0) +
                  (item.physicalItem?.fakeViewCount || 0);
                const wishlist = 47; // Fallback hardcodé
                const price = item.physicalItem?.price;
                return (
                  <div key={item.id} className={styles.row}>
                    <div className={styles.thumb}>
                      <Image
                        src={item.mainImageUrl || "/images/no-image.jpg"}
                        alt={item.name || "Sans titre"}
                        width={120}
                        height={120}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                        priority
                      />
                    </div>

                    <div className={styles.info}>
                      <div className={styles.title}>
                        {item.name || "Sans titre"}
                      </div>
                      <div className={styles.meta}>
                        Créé le {formatDateFR(item.createdAt)}
                      </div>
                      {price !== undefined && (
                        <div className={styles.price}>{formatPrice(price)}</div>
                      )}
                      <div className={styles.actions}>
                        <NavigationButton
                          href={`/art/editPhysicalArtwork/${item.id}`}
                          className={`${styles.btn} ${styles.btnPrimary}`}
                        >
                          Modifier
                        </NavigationButton>
                        <button type="button" className={styles.btn}>
                          <ExternalLink size={16} /> Afficher la page
                        </button>
                      </div>
                    </div>

                    <div className={styles.stats}>
                      <div className={styles.statItem}>
                        <span className="flex items-center gap-2">
                          <Eye size={16} /> Vues
                        </span>
                        <span className={styles.number}>{views || 15841}</span>
                      </div>
                      <div className={styles.statItem}>
                        <span className="flex items-center gap-2">
                          <Heart size={16} /> Wishlist
                        </span>
                        <span className={styles.number}>{wishlist}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
