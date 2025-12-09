"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import LoadingSpinner from "@/app/components/LoadingSpinner/LoadingSpinner";
import ProductCard from "@/app/components/ProductCard/ProductCard";
import { fetchItemsData, ItemData } from "@/lib/actions/items-actions";
import { getBackofficeUserByEmail } from "@/lib/actions/prisma-actions";

type BackofficeUserResult = Awaited<
  ReturnType<typeof getBackofficeUserByEmail>
>;

export default function CollectionPage() {
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [itemsData, setItemsData] = useState<ItemData[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userDB, setUserDB] = useState<BackofficeUserResult>(null);

  useEffect(() => {
    // Attendre que la session soit chargée
    if (isSessionPending) {
      return;
    }

    // Ne rien faire si l'utilisateur n'est pas connecté
    if (!session?.user?.email) {
      setIsLoading(false);
      setError("Vous devez être connecté pour voir votre collection");
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
          setItemsData(result.data || []);
        }
        setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [session?.user?.email, isSessionPending]); // Dépendance sur l'email de la session

  if (isLoading) {
    return <LoadingSpinner message="Chargement de vos œuvres..." />;
  }

  return (
    <div className="page-container">
      <h1 className="page-title">Mes Œuvres</h1>

      {error ? (
        <div className="alert alert-error">{error}</div>
      ) : !itemsData || itemsData.length === 0 ? (
        <div className="empty-state">
          <p>Aucune œuvre trouvée dans votre collection</p>
        </div>
      ) : (
        <>
          <div className="card">
            <h2 className="card-title">
              Collection de {userDB?.name || session?.user?.email}
            </h2>
          </div>

          <div className="section">
            <h3 className="section-title">Mes œuvres ({itemsData.length})</h3>

            <div className="products-grid">
              {itemsData.map((item) => (
                <ProductCard
                  key={item.id}
                  id={item.id}
                  name={item.name || "Sans titre"}
                  mainImageUrl={item.mainImageUrl || "/images/no-image.jpg"}
                  userId={userDB?.id}
                  tags={item.tags}
                  physicalItem={item.physicalItem}
                  nftItem={item.nftItem}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
