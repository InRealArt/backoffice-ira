"use client";

import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";
import Image from "next/image";
import { User, Settings, FolderOpen, PlusCircle } from "lucide-react";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";
import NavigationButton from "../NavigationButton";
import { DashboardCard } from "./DashboardCard/DashboardCard";
import {
  getPendingItemsCount,
  getUserMintedItemsCount,
  getUserListedItemsCount,
  getUserPhysicalItemsCount,
  getBackofficeUserByEmail,
  getVisibleLandingArtistsCount,
} from "@/lib/actions/prisma-actions";
import { getPresaleArtworkCountByArtist } from "@/lib/actions/presale-artwork-actions";
import { useIsAdmin } from "@/app/hooks/useIsAdmin";
import { DashboardStats } from "./DashboardStats";

export default function Dashboard() {
  const { data: session } = authClient.useSession();
  const user = session?.user;
  // Note: primaryWallet sera géré plus tard dans une migration séparée des wallets
  const primaryWallet = null as { address?: string } | null;
  const [pendingItemsCount, setPendingItemsCount] = useState(0);
  const [visibleArtistsCount, setVisibleArtistsCount] = useState(0);
  const [mintedItemsCount, setMintedItemsCount] = useState(0);
  const [listedItemsCount, setListedItemsCount] = useState(0);
  const [isLoadingCount, setIsLoadingCount] = useState(true);
  const [isLoadingArtistsCount, setIsLoadingArtistsCount] = useState(true);
  const [isLoadingUserCounts, setIsLoadingUserCounts] = useState(true);
  const [associatedArtist, setAssociatedArtist] = useState<any>(null);
  const [isLoadingArtist, setIsLoadingArtist] = useState(true);
  const [presaleArtworkCount, setPresaleArtworkCount] = useState(0);
  const [isLoadingPresaleCount, setIsLoadingPresaleCount] = useState(true);
  const [physicalItemsCount, setPhysicalItemsCount] = useState(0);
  const [isLoadingPhysicalItemsCount, setIsLoadingPhysicalItemsCount] = useState(true);
  const [availablePhysicalItemsCount, setAvailablePhysicalItemsCount] = useState(0);
  const [unavailablePhysicalItemsCount, setUnavailablePhysicalItemsCount] = useState(0);
  const [isLoadingAvailablePhysicalItemsCount, setIsLoadingAvailablePhysicalItemsCount] = useState(true);
  const [isLoadingUnavailablePhysicalItemsCount, setIsLoadingUnavailablePhysicalItemsCount] = useState(true);
  const { isAdmin, isLoading } = useIsAdmin();

  const truncateAddress = (address: string | undefined) => {
    if (!address) return "Non défini";
    const start = address.substring(0, 6);
    const end = address.substring(address.length - 4);
    return `${start}...${end}`;
  };

  useEffect(() => {
    const fetchAdminStats = async () => {
      if (isAdmin) {
        try {
          const { count } = await getVisibleLandingArtistsCount();
          setVisibleArtistsCount(count);
        } catch (error) {
          console.error(
            "Erreur lors de la récupération du nombre d'artistes visibles:",
            error
          );
          // En cas d'erreur (timeout ou autre), définir une valeur par défaut
          setVisibleArtistsCount(0);
        } finally {
          setIsLoadingArtistsCount(false);
        }
      }
    };

    fetchAdminStats();
  }, [isAdmin]);

  useEffect(() => {
    const fetchPendingItems = async () => {
      if (!isAdmin) {
        try {
          const { count } = await getPendingItemsCount();
          setPendingItemsCount(count);
        } catch (error) {
          console.error(
            "Erreur lors de la récupération du nombre d'items:",
            error
          );
          // En cas d'erreur (timeout ou autre), définir une valeur par défaut
          setPendingItemsCount(0);
        } finally {
          setIsLoadingCount(false);
        }
      }
    };

    fetchPendingItems();
  }, [isAdmin]);

  useEffect(() => {
    let isMounted = true;

    const fetchUserItemsStats = async () => {
      const userEmail = user?.email;

      if (!isAdmin && userEmail) {
        try {
          const backofficeUser = await getBackofficeUserByEmail(userEmail);

          if (!isMounted) return;

          if (!backofficeUser) {
            console.error("Utilisateur Backoffice non trouvé pour cet email");
            setIsLoadingUserCounts(false);
            setIsLoadingArtist(false);
            setIsLoadingPresaleCount(false);
            setIsLoadingPhysicalItemsCount(false);
            setIsLoadingAvailablePhysicalItemsCount(false);
            setIsLoadingUnavailablePhysicalItemsCount(false);
            return;
          }

          // Utiliser directement l'artiste déjà inclus dans backofficeUser
          if (backofficeUser.artist) {
            setAssociatedArtist(backofficeUser.artist);

            // Récupérer le nombre d'œuvres en prévente pour cet artiste
            const presaleCountResult = await getPresaleArtworkCountByArtist(
              backofficeUser.artist.id
            );
            if (!isMounted) return;
            setPresaleArtworkCount(presaleCountResult.count);
            setIsLoadingPresaleCount(false);
          } else {
            // Pas d'artiste, donc pas d'œuvres en prévente
            setIsLoadingPresaleCount(false);
          }

          if (!isMounted) return;

          setIsLoadingArtist(false);

          const mintedResult = await getUserMintedItemsCount(backofficeUser.id);
          const listedResult = await getUserListedItemsCount(backofficeUser.id);
          const physicalItemsResult = await getUserPhysicalItemsCount(backofficeUser.id);

          if (!isMounted) return;

          setMintedItemsCount(mintedResult.count);
          setListedItemsCount(listedResult.count);
          setPhysicalItemsCount(physicalItemsResult.count);
          setAvailablePhysicalItemsCount(physicalItemsResult.availableCount);
          setUnavailablePhysicalItemsCount(physicalItemsResult.unavailableCount);
          setIsLoadingPhysicalItemsCount(false);
          setIsLoadingAvailablePhysicalItemsCount(false);
          setIsLoadingUnavailablePhysicalItemsCount(false);
        } catch (error) {
          if (!isMounted) return;
          console.error(
            "Erreur lors de la récupération des statistiques d'items:",
            error
          );
          // En cas d'erreur (timeout ou autre), définir des valeurs par défaut
          setMintedItemsCount(0);
          setListedItemsCount(0);
          setPresaleArtworkCount(0);
          setPhysicalItemsCount(0);
          setAvailablePhysicalItemsCount(0);
          setUnavailablePhysicalItemsCount(0);
          setIsLoadingPhysicalItemsCount(false);
          setIsLoadingAvailablePhysicalItemsCount(false);
          setIsLoadingUnavailablePhysicalItemsCount(false);
        } finally {
          if (isMounted) {
            setIsLoadingUserCounts(false);
            setIsLoadingArtist(false);
            setIsLoadingPresaleCount(false);
          }
        }
      }
    };

    fetchUserItemsStats();

    return () => {
      isMounted = false;
    };
  }, [isAdmin, user?.email]); // Utiliser user?.email au lieu de user pour stabiliser

  if (isLoading)
    return (
      <LoadingSpinner fullPage message="Chargement du tableau de bord..." />
    );

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Tableau de bord</h2>

      <DashboardStats
        presaleArtworkCount={presaleArtworkCount}
        isLoadingPresaleCount={isLoadingPresaleCount}
        mintedItemsCount={mintedItemsCount}
        isLoadingMintedCount={isLoadingUserCounts}
        listedItemsCount={listedItemsCount}
        isLoadingListedCount={isLoadingUserCounts}
        pendingItemsCount={pendingItemsCount}
        isLoadingPendingCount={isLoadingCount}
        physicalItemsCount={physicalItemsCount}
        isLoadingPhysicalItemsCount={isLoadingPhysicalItemsCount}
        availablePhysicalItemsCount={availablePhysicalItemsCount}
        unavailablePhysicalItemsCount={unavailablePhysicalItemsCount}
        isLoadingAvailablePhysicalItemsCount={isLoadingAvailablePhysicalItemsCount}
        isLoadingUnavailablePhysicalItemsCount={isLoadingUnavailablePhysicalItemsCount}
        visibleArtistsCount={visibleArtistsCount}
        isLoadingArtistsCount={isLoadingArtistsCount}
        isAdmin={isAdmin}
      />

      <div className="dashboard-content">
        <DashboardCard
          title="Informations utilisateur"
          icon={<User />}
          description="Vos informations de compte"
        >
          <p>
            <strong>Email:</strong> {user?.email || "Non défini"}
          </p>
          {!isAdmin && (
            <>
              {isLoadingArtist ? (
                <p>
                  <strong>Artiste associé:</strong> Chargement...
                </p>
              ) : associatedArtist ? (
                <>
                  <p>
                    <strong>Artiste associé:</strong> {associatedArtist.name}{" "}
                    {associatedArtist.surname}
                  </p>
                  {associatedArtist.imageUrl && (
                    <div className="artist-image-container">
                      <Image
                        src={associatedArtist.imageUrl}
                        alt={`${associatedArtist.name} ${associatedArtist.surname}`}
                        width={150}
                        height={150}
                        style={{
                          borderRadius: "12px",
                          objectFit: "cover",
                          width: "100%",
                          height: "auto",
                        }}
                      />
                    </div>
                  )}
                  <div className="mt-3">
                    <NavigationButton
                      href="/art/edit-artist-profile"
                      variant="primary"
                    >
                      Éditer mon profil artiste
                    </NavigationButton>
                  </div>
                </>
              ) : (
                <>
                  <p>
                    <strong>Artiste associé:</strong> Aucun
                  </p>
                  <div className="mt-3">
                    <NavigationButton
                      href="/art/create-artist-profile"
                      variant="primary"
                    >
                      Créer mon profil Artiste
                    </NavigationButton>
                  </div>
                </>
              )}
            </>
          )}
        </DashboardCard>

        {isAdmin ? (
          <>
            <DashboardCard
              title="Panneau d'Administration"
              icon={<Settings />}
              description="Gérez les utilisateurs et les paramètres"
            >
              <p>Voir les utilisateurs et leurs informations.</p>
              <NavigationButton href="/boAdmin/users">
                Voir les utilisateurs
              </NavigationButton>
            </DashboardCard>
          </>
        ) : (
          <>
            {!isLoadingArtist && associatedArtist && (
              <>
                {/* <DashboardCard
                  title="Mes Collections"
                  icon={<FolderOpen />}
                  description="Explorez et gérez vos œuvres"
                >
                  <p>Explorez et gérez votre collection d'œuvres d'art.</p>
                  <Button
                    onClick={() => router.push("/art/physicalCollection")}
                  >
                    Voir mes collections
                  </Button>
                </DashboardCard> */}

                <DashboardCard
                  title="Création d'œuvre en prévente sur le site Web InRealArt"
                  icon={<PlusCircle />}
                  description="Créez de nouvelles œuvres d'art en prévente sur le site Web InRealArt"
                >
                  <p>
                    Créez et publiez une nouvelle œuvre d'art en prévente sur le
                    site Web InRealArt.
                  </p>
                  <NavigationButton href="/art/create-presale-artwork">
                    Créer une œuvre
                  </NavigationButton>
                </DashboardCard>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
