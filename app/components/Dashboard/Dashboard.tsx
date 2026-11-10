"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { authClient } from "@/lib/auth-client";
import Image from "next/image";
import { User, Users, Package, FolderOpen, PlusCircle } from "lucide-react";
import LoadingSpinner from "../LoadingSpinner/LoadingSpinner";
import NavigationButton from "../NavigationButton";
import { Link } from "@/i18n/navigation";
import { DashboardCard } from "./DashboardCard/DashboardCard";
import {
  getPendingItemsCount,
  getUserMintedItemsCount,
  getUserListedItemsCount,
  getUserPhysicalItemsCount,
  getUserPhysicalCollectionsCount,
  getBackofficeUserByEmail,
  getVisibleLandingArtistsCount,
} from "@/lib/actions/prisma-actions";
import { getPresaleArtworkCountByArtist } from "@/lib/actions/presale-artwork-actions";
import { useIsAdmin } from "@/app/hooks/useIsAdmin";
import { DashboardStats } from "./DashboardStats";
import { getImageUrlWithCacheBuster } from "@/lib/r2/url";

export default function Dashboard() {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const [todayLabel, setTodayLabel] = useState("");
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
  const [isLoadingPhysicalItemsCount, setIsLoadingPhysicalItemsCount] =
    useState(true);
  const [availablePhysicalItemsCount, setAvailablePhysicalItemsCount] =
    useState(0);
  const [unavailablePhysicalItemsCount, setUnavailablePhysicalItemsCount] =
    useState(0);
  const [
    isLoadingAvailablePhysicalItemsCount,
    setIsLoadingAvailablePhysicalItemsCount,
  ] = useState(true);
  const [
    isLoadingUnavailablePhysicalItemsCount,
    setIsLoadingUnavailablePhysicalItemsCount,
  ] = useState(true);
  const [physicalCollectionsCount, setPhysicalCollectionsCount] = useState(0);
  const [
    isLoadingPhysicalCollectionsCount,
    setIsLoadingPhysicalCollectionsCount,
  ] = useState(true);
  const { isAdmin, isLoading } = useIsAdmin();

  // Date du jour calculée côté client uniquement (évite un écart serveur/client à minuit)
  useEffect(() => {
    const label = new Intl.DateTimeFormat(locale, {
      weekday: "long",
      day: "numeric",
      month: "long",
    }).format(new Date());
    setTodayLabel(label.charAt(0).toUpperCase() + label.slice(1));
  }, [locale]);

  const truncateAddress = (address: string | undefined) => {
    if (!address) return t("notDefined");
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
          console.error(t("errors.fetchingArtists"), error);
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
          console.error(t("errors.fetchingItems"), error);
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
            console.error(t("errors.userNotFound"));
            setIsLoadingUserCounts(false);
            setIsLoadingArtist(false);
            setIsLoadingPresaleCount(false);
            setIsLoadingPhysicalItemsCount(false);
            setIsLoadingAvailablePhysicalItemsCount(false);
            setIsLoadingUnavailablePhysicalItemsCount(false);
            setIsLoadingPhysicalCollectionsCount(false);
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
          const physicalItemsResult = await getUserPhysicalItemsCount(
            backofficeUser.id
          );
          const physicalCollectionsResult =
            await getUserPhysicalCollectionsCount();

          if (!isMounted) return;

          setMintedItemsCount(mintedResult.count);
          setListedItemsCount(listedResult.count);
          setPhysicalItemsCount(physicalItemsResult.count);
          setAvailablePhysicalItemsCount(physicalItemsResult.availableCount);
          setUnavailablePhysicalItemsCount(
            physicalItemsResult.unavailableCount
          );
          setPhysicalCollectionsCount(physicalCollectionsResult.count);
          setIsLoadingPhysicalItemsCount(false);
          setIsLoadingAvailablePhysicalItemsCount(false);
          setIsLoadingUnavailablePhysicalItemsCount(false);
          setIsLoadingPhysicalCollectionsCount(false);
        } catch (error) {
          if (!isMounted) return;
          console.error(t("errors.fetchingStats"), error);
          // En cas d'erreur (timeout ou autre), définir des valeurs par défaut
          setMintedItemsCount(0);
          setListedItemsCount(0);
          setPresaleArtworkCount(0);
          setPhysicalItemsCount(0);
          setAvailablePhysicalItemsCount(0);
          setUnavailablePhysicalItemsCount(0);
          setPhysicalCollectionsCount(0);
          setIsLoadingPhysicalItemsCount(false);
          setIsLoadingAvailablePhysicalItemsCount(false);
          setIsLoadingUnavailablePhysicalItemsCount(false);
          setIsLoadingPhysicalCollectionsCount(false);
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

  if (isLoading) return <LoadingSpinner fullPage message={t("loading")} />;

  // Prénom affiché dans le message d'accueil : pseudo/prénom de l'artiste, sinon nom du compte
  const rawName = isAdmin
    ? user?.name
    : associatedArtist?.pseudo || associatedArtist?.name || user?.name;
  const firstName = rawName?.trim().split(/\s+/)[0] || "";

  // Raccourcis selon le rôle. Les fonctions marketplace sont masquées en production, comme les cartes.
  const isProduction = process.env.NODE_ENV === "production";
  const quickActions = isAdmin
    ? [
        { href: "/dataAdministration/artists", icon: Users, label: t("quickActions.adminArtists"), primary: true },
        { href: "/landing/presaleArtworks", icon: Package, label: t("quickActions.adminPresale") },
        { href: "/boAdmin/users", icon: User, label: t("quickActions.adminUsers") },
      ]
    : associatedArtist
      ? [
          { href: "/art/create-presale-artwork", icon: PlusCircle, label: t("quickActions.createPresale"), primary: true },
          ...(!isProduction
            ? [
                { href: "/art/createPhysicalArtwork", icon: PlusCircle, label: t("quickActions.createPhysical") },
                { href: "/art/myPhysicalArtwork", icon: FolderOpen, label: t("quickActions.myArtworks") },
              ]
            : []),
        ]
      : [];

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          {todayLabel && <p className="dashboard-eyebrow">{todayLabel}</p>}
          <h2 className="dashboard-title">
            <span className="sr-only">{t("title")} : </span>
            {firstName ? t("greeting", { name: firstName }) : t("greetingAnonymous")}
          </h2>
        </div>
        <span className="dashboard-role">
          {isAdmin ? t("role.admin") : t("role.artist")}
        </span>
      </div>

      {!isAdmin && !isLoadingArtist && !associatedArtist && (
        <div className="dashboard-banner" role="note">
          <div>
            <strong>{t("profileBanner.title")}</strong>
            <p>{t("profileBanner.description")}</p>
          </div>
          <NavigationButton href="/art/create-artist-profile" variant="primary">
            {t("userInfo.createProfile")}
          </NavigationButton>
        </div>
      )}

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
        isLoadingAvailablePhysicalItemsCount={
          isLoadingAvailablePhysicalItemsCount
        }
        isLoadingUnavailablePhysicalItemsCount={
          isLoadingUnavailablePhysicalItemsCount
        }
        physicalCollectionsCount={physicalCollectionsCount}
        isLoadingPhysicalCollectionsCount={isLoadingPhysicalCollectionsCount}
        visibleArtistsCount={visibleArtistsCount}
        isLoadingArtistsCount={isLoadingArtistsCount}
        isAdmin={isAdmin}
      />

      {quickActions.length > 0 && (
        <section className="dashboard-quick" aria-labelledby="dashboard-quick-title">
          <h3 id="dashboard-quick-title" className="dashboard-section-title">
            {t("quickActions.title")}
          </h3>
          <div className="dashboard-quick-list">
            {quickActions.map(({ href, icon: Icon, label, primary }) => (
              <Link
                key={href}
                href={href}
                className={`btn btn-medium${primary ? " btn-primary" : ""}`}
              >
                <Icon size={16} aria-hidden="true" />
                {label}
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="dashboard-content">
        <DashboardCard
          title={t("userInfo.title")}
          icon={<User />}
          description={t("userInfo.description")}
        >
          <p>
            <strong>{t("userInfo.email")}</strong>{" "}
            {user?.email || t("notDefined")}
          </p>
          {!isAdmin && (
            <>
              {isLoadingArtist ? (
                <p>
                  <strong>{t("userInfo.associatedArtist")}</strong>{" "}
                  {t("userInfo.loading")}
                </p>
              ) : associatedArtist ? (
                <>
                  <p>
                    <strong>{t("userInfo.associatedArtist")}</strong>{" "}
                    {associatedArtist.name} {associatedArtist.surname}
                  </p>
                  {getImageUrlWithCacheBuster(associatedArtist.imageUrl) && (
                    <div className="artist-image-container">
                      <Image
                        src={getImageUrlWithCacheBuster(associatedArtist.imageUrl)!}
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
                      {t("userInfo.editProfile")}
                    </NavigationButton>
                  </div>
                </>
              ) : (
                <>
                  <p>
                    <strong>{t("userInfo.associatedArtist")}</strong>{" "}
                    {t("userInfo.none")}
                  </p>
                  <div className="mt-3">
                    <NavigationButton
                      href="/art/create-artist-profile"
                      variant="primary"
                    >
                      {t("userInfo.createProfile")}
                    </NavigationButton>
                  </div>
                </>
              )}
            </>
          )}
        </DashboardCard>

      </div>
    </div>
  );
}
