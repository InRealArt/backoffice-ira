"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSideMenuLogic } from "../SideMenu/useSideMenuLogic";
import { authClient } from "@/lib/auth-client";
import {
  getBackofficeUserByEmail,
  getArtistById,
} from "@/lib/actions/prisma-actions";
import {
  LayoutDashboard,
  Image,
  MapPin,
  PlusCircle,
  Globe,
  Languages,
  FileText,
  Users,
  HelpCircle,
  BookOpen,
  ShoppingCart,
  Folder,
  Layout,
  Database,
  Tag,
  Palette,
  Brush,
  Wrench,
  Shield,
  UserPlus,
  Link,
  FileCode,
  Coins,
  Store,
  Sparkles,
  ShoppingBag,
  Receipt,
  UserCircle,
} from "lucide-react";

export default function NavbarMenu() {
  const pathname = usePathname();
  const {
    isLoggedIn,
    activeItem,
    canAccessCollection,
    isAdmin,
    isLoading,
    isNavigating,
    navigatingItem,
    handleNavigation,
  } = useSideMenuLogic();

  // Récupérer la session utilisateur
  const { data: session } = authClient.useSession();
  const user = session?.user;

  // État pour l'artiste associé
  const [associatedArtist, setAssociatedArtist] = useState<any>(null);
  const [isLoadingArtist, setIsLoadingArtist] = useState(true);

  // État pour contrôler l'ouverture du menu dropdown mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const desktopMenuRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    await authClient.signOut();
  };

  // Fonction pour gérer la navigation avec fermeture du menu
  const handleMenuNavigation = async (path: string, item: string) => {
    // Fermer le menu mobile
    setIsMobileMenuOpen(false);
    // Désactiver le focus du dropdown pour le fermer
    if (mobileMenuRef.current) {
      const button = mobileMenuRef.current.querySelector(
        '[tabIndex="0"]'
      ) as HTMLElement;
      if (button) {
        button.blur();
      }
    }
    // Appeler la navigation
    await handleNavigation(path, item);
  };

  // Fonction pour vérifier si un item est en cours de navigation
  const isItemNavigating = (item: string) => {
    return isNavigating && navigatingItem === item;
  };

  // Fonction helper pour créer un élément de menu avec spinner
  const createMenuLink = (
    path: string,
    item: string,
    label: string,
    isMobile = false
  ) => {
    const handleClick = () => {
      if (isMobile) {
        handleMenuNavigation(path, item);
      } else {
        handleNavigation(path, item);
      }
    };

    return (
      <a
        onClick={handleClick}
        className={`flex items-center gap-2 ${isMobile ? "" : ""}`}
      >
        {isItemNavigating(item) ? (
          <>
            <span className="loading loading-spinner loading-sm"></span>
            <span>{label}</span>
          </>
        ) : (
          <span>{label}</span>
        )}
      </a>
    );
  };

  // Récupérer l'artiste associé à l'utilisateur
  useEffect(() => {
    let isMounted = true;

    const fetchAssociatedArtist = async () => {
      const userEmail = user?.email;

      if (!isAdmin && userEmail && canAccessCollection) {
        setIsLoadingArtist(true);
        try {
          const backofficeUser = await getBackofficeUserByEmail(userEmail);

          if (!isMounted) return;

          if (!backofficeUser) {
            setIsLoadingArtist(false);
            setAssociatedArtist(null);
            return;
          }

          // Récupérer l'artiste associé - utiliser directement l'artiste inclus dans la requête si disponible
          if (backofficeUser.artistId) {
            // Si l'artiste est déjà inclus dans la requête, l'utiliser directement
            if (backofficeUser.artist) {
              if (!isMounted) return;
              setAssociatedArtist(backofficeUser.artist);
            } else {
              // Sinon, faire un appel séparé
              const artist = await getArtistById(backofficeUser.artistId);
              if (!isMounted) return;

              if (artist) {
                setAssociatedArtist(artist);
              }
            }
          } else {
            // Pas d'artiste associé
            setAssociatedArtist(null);
          }

          if (!isMounted) return;
          setIsLoadingArtist(false);
        } catch (error) {
          if (!isMounted) return;
          console.error(
            "Erreur lors de la récupération de l'artiste associé:",
            error
          );
          setAssociatedArtist(null);
          setIsLoadingArtist(false);
        }
      } else {
        setAssociatedArtist(null);
        setIsLoadingArtist(false);
      }
    };

    fetchAssociatedArtist();

    return () => {
      isMounted = false;
    };
  }, [isAdmin, user?.email, canAccessCollection, pathname]);

  // Fermer le menu dropdown quand la page est chargée (pathname change)
  useEffect(() => {
    // Fermer le menu mobile
    setIsMobileMenuOpen(false);

    // Fermer le dropdown mobile en retirant le focus
    if (mobileMenuRef.current) {
      const button = mobileMenuRef.current.querySelector(
        '[tabIndex="0"]'
      ) as HTMLElement;
      if (button) {
        button.blur();
      }
    }

    // Fermer les sous-menus desktop en retirant l'attribut open des details
    if (desktopMenuRef.current) {
      const details = desktopMenuRef.current.querySelectorAll("details[open]");
      details.forEach((detail) => {
        (detail as HTMLDetailsElement).removeAttribute("open");
      });
    }
  }, [pathname]);

  if (!isLoggedIn || isLoading) {
    return null;
  }

  // Fonction pour rendre les items de menu pour mobile
  const renderMobileMenuItems = () => {
    // Si l'utilisateur n'a pas d'artiste associé, afficher uniquement "Créer mon profil artiste"
    if (
      canAccessCollection &&
      !isAdmin &&
      !isLoadingArtist &&
      !associatedArtist
    ) {
      return (
        <>
          <li>
            <a
              onClick={() =>
                handleMenuNavigation(
                  "/art/create-artist-profile",
                  "createArtistProfile"
                )
              }
              className="flex items-center gap-2"
            >
              {isItemNavigating("createArtistProfile") ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  <UserCircle size={18} />
                  <span>Créer mon profil artiste</span>
                </>
              ) : (
                <>
                  <UserCircle size={18} />
                  <span>Créer mon profil artiste</span>
                </>
              )}
            </a>
          </li>
        </>
      );
    }

    if (canAccessCollection && !isAdmin) {
      return (
        <>
          <li>
            <a
              onClick={() => handleMenuNavigation("/dashboard", "dashboard")}
              className="flex items-center gap-2"
            >
              {isItemNavigating("dashboard") ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </>
              ) : (
                <>
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </>
              )}
            </a>
          </li>
          <li className="divider my-1"></li>
          {/* Bloc Profil */}
          <li>
            <a className="menu-title text-base-content/60 text-xs font-semibold tracking-widest flex items-center gap-2">
              <UserCircle size={16} />
              PROFIL
            </a>
            <ul className="p-2 bg-background-white dark:bg-background-white rounded-lg mt-1 border border-border dark:border-border">
              <li>
                <a
                  onClick={() =>
                    handleMenuNavigation(
                      "/art/edit-artist-profile",
                      "editArtistProfile"
                    )
                  }
                  className="flex items-center gap-2"
                >
                  {isItemNavigating("editArtistProfile") ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <UserCircle size={18} />
                      <span>Éditer mon profil</span>
                    </>
                  ) : (
                    <>
                      <UserCircle size={18} />
                      <span>Éditer mon profil</span>
                    </>
                  )}
                </a>
              </li>
            </ul>
          </li>
          <li className="divider my-1"></li>
          {/* Bloc Site web InRealArt */}
          <li>
            <a className="menu-title text-base-content/60 text-xs font-semibold tracking-widest flex items-center gap-2">
              <Globe size={16} />
              SITE WEB INREALART
            </a>
            <ul className="p-2 bg-background-white dark:bg-background-white rounded-lg mt-1 border border-border dark:border-border">
              <li>
                <a
                  onClick={() =>
                    handleMenuNavigation(
                      "/art/create-presale-artwork",
                      "createPresaleArtwork"
                    )
                  }
                  className="flex items-center gap-2"
                >
                  {isItemNavigating("createPresaleArtwork") ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <PlusCircle size={18} />
                      <span>Créer une œuvre</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle size={18} />
                      <span>Créer une œuvre</span>
                    </>
                  )}
                </a>
              </li>
              <li>
                <a
                  onClick={() =>
                    handleMenuNavigation("/art/my-artworks", "myArtworks")
                  }
                  className="flex items-center gap-2"
                >
                  {isItemNavigating("myArtworks") ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <Image size={18} />
                      <span>Voir mes œuvres</span>
                    </>
                  ) : (
                    <>
                      <Image size={18} />
                      <span>Voir mes œuvres</span>
                    </>
                  )}
                </a>
              </li>
            </ul>
          </li>
          <li className="divider my-1"></li>
          {/* Bloc Marketplace */}
          <li>
            <a className="menu-title text-base-content/60 text-xs font-semibold tracking-widest flex items-center gap-2">
              <Store size={16} />
              MARKETPLACE
            </a>
            <ul className="p-2 bg-background-white dark:bg-background-white rounded-lg mt-1 border border-border dark:border-border">
              <li>
                <a
                  onClick={() =>
                    handleMenuNavigation(
                      "/art/myPhysicalArtwork",
                      "myPhysicalArtwork"
                    )
                  }
                  className="flex items-center gap-2"
                >
                  {isItemNavigating("myPhysicalArtwork") ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <Image size={18} />
                      <span>Voir mes œuvres</span>
                    </>
                  ) : (
                    <>
                      <Image size={18} />
                      <span>Voir mes œuvres</span>
                    </>
                  )}
                </a>
              </li>
              <li>
                <a
                  onClick={() =>
                    handleMenuNavigation(
                      "/art/physicalCollection",
                      "physicalCollection"
                    )
                  }
                  className="flex items-center gap-2"
                >
                  {isItemNavigating("physicalCollection") ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <Folder size={18} />
                      <span>Voir mes collections</span>
                    </>
                  ) : (
                    <>
                      <Folder size={18} />
                      <span>Voir mes collections</span>
                    </>
                  )}
                </a>
              </li>
            </ul>
          </li>
        </>
      );
    }

    if (isAdmin) {
      return (
        <>
          <li>
            <a
              onClick={() => handleMenuNavigation("/dashboard", "dashboard")}
              className="flex items-center gap-2"
            >
              {isItemNavigating("dashboard") ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </>
              ) : (
                <>
                  <LayoutDashboard size={18} />
                  <span>Dashboard</span>
                </>
              )}
            </a>
          </li>
          <li className="divider my-1"></li>
          <li>
            <a className="menu-title text-base-content/60 text-xs font-semibold tracking-widest flex items-center gap-2">
              <Globe size={16} />
              LANDING PAGES
            </a>
            <ul className="p-2 bg-background-white dark:bg-background-white rounded-lg mt-1 border border-border dark:border-border">
              <li>
                <a
                  onClick={() =>
                    handleMenuNavigation("/landing/languages", "languages")
                  }
                  className="flex items-center gap-2"
                >
                  {isItemNavigating("languages") ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <Languages size={18} />
                      <span>Languages</span>
                    </>
                  ) : (
                    <>
                      <Languages size={18} />
                      <span>Languages</span>
                    </>
                  )}
                </a>
              </li>
              <li>
                <a
                  onClick={() =>
                    handleMenuNavigation(
                      "/landing/translations",
                      "translations"
                    )
                  }
                  className="flex items-center gap-2"
                >
                  {isItemNavigating("translations") ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <FileText size={18} />
                      <span>Translations</span>
                    </>
                  ) : (
                    <>
                      <FileText size={18} />
                      <span>Translations</span>
                    </>
                  )}
                </a>
              </li>
              <li>
                <a
                  onClick={() => handleMenuNavigation("/landing/team", "team")}
                  className="flex items-center gap-2"
                >
                  {isItemNavigating("team") ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <Users size={18} />
                      <span>Team</span>
                    </>
                  ) : (
                    <>
                      <Users size={18} />
                      <span>Team</span>
                    </>
                  )}
                </a>
              </li>
              <li>
                <a
                  onClick={() => handleMenuNavigation("/landing/faq", "faq")}
                  className="flex items-center gap-2"
                >
                  {isItemNavigating("faq") ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <HelpCircle size={18} />
                      <span>FAQ</span>
                    </>
                  ) : (
                    <>
                      <HelpCircle size={18} />
                      <span>FAQ</span>
                    </>
                  )}
                </a>
              </li>
              <li>
                <a
                  onClick={() =>
                    handleMenuNavigation("/landing/detailedFaq", "detailedFaq")
                  }
                  className="flex items-center gap-2"
                >
                  {isItemNavigating("detailedFaq") ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <FileText size={18} />
                      <span>FAQ détaillée</span>
                    </>
                  ) : (
                    <>
                      <FileText size={18} />
                      <span>FAQ détaillée</span>
                    </>
                  )}
                </a>
              </li>
              <li>
                <a
                  onClick={() =>
                    handleMenuNavigation(
                      "/landing/detailedFaqPage",
                      "detailedFaqPage"
                    )
                  }
                  className="flex items-center gap-2"
                >
                  {isItemNavigating("detailedFaqPage") ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <BookOpen size={18} />
                      <span>FAQ par page</span>
                    </>
                  ) : (
                    <>
                      <BookOpen size={18} />
                      <span>FAQ par page</span>
                    </>
                  )}
                </a>
              </li>
              <li>
                <a
                  onClick={() =>
                    handleMenuNavigation(
                      "/landing/detailedGlossary",
                      "detailedGlossary"
                    )
                  }
                  className="flex items-center gap-2"
                >
                  {isItemNavigating("detailedGlossary") ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <BookOpen size={18} />
                      <span>Glossaire détaillé</span>
                    </>
                  ) : (
                    <>
                      <BookOpen size={18} />
                      <span>Glossaire détaillé</span>
                    </>
                  )}
                </a>
              </li>
              <li>
                <a
                  onClick={() =>
                    handleMenuNavigation(
                      "/landing/landingArtists",
                      "landingArtists"
                    )
                  }
                  className="flex items-center gap-2"
                >
                  {isItemNavigating("landingArtists") ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <Users size={18} />
                      <span>Page artistes</span>
                    </>
                  ) : (
                    <>
                      <Users size={18} />
                      <span>Page artistes</span>
                    </>
                  )}
                </a>
              </li>
              <li>
                <a
                  onClick={() =>
                    handleMenuNavigation(
                      "/landing/presaleArtworks",
                      "presaleArtworks"
                    )
                  }
                  className="flex items-center gap-2"
                >
                  {isItemNavigating("presaleArtworks") ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <ShoppingCart size={18} />
                      <span>Œuvres en prévente</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart size={18} />
                      <span>Œuvres en prévente</span>
                    </>
                  )}
                </a>
              </li>
              <li>
                <a
                  onClick={() =>
                    handleMenuNavigation("/landing/seo-posts", "seoPosts")
                  }
                  className="flex items-center gap-2"
                >
                  {isItemNavigating("seoPosts") ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <FileText size={18} />
                      <span>Articles de blog</span>
                    </>
                  ) : (
                    <>
                      <FileText size={18} />
                      <span>Articles de blog</span>
                    </>
                  )}
                </a>
              </li>
            </ul>
          </li>
          <li className="divider my-1"></li>
          <li>
            <a className="menu-title text-base-content/60 text-xs font-semibold tracking-widest flex items-center gap-2">
              <Database size={16} />
              DATA ADMINISTRATION
            </a>
            <ul className="p-2 bg-background-white dark:bg-background-white rounded-lg mt-1 border border-border dark:border-border">
              <li>
                <a
                  onClick={() =>
                    handleMenuNavigation(
                      "/dataAdministration/artists",
                      "artists"
                    )
                  }
                  className="flex items-center gap-2"
                >
                  {isItemNavigating("artists") ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <Users size={18} />
                      <span>Artistes</span>
                    </>
                  ) : (
                    <>
                      <Users size={18} />
                      <span>Artistes</span>
                    </>
                  )}
                </a>
              </li>
              <li>
                <a
                  onClick={() =>
                    handleMenuNavigation(
                      "/dataAdministration/artist-categories",
                      "artist-categories"
                    )
                  }
                  className="flex items-center gap-2"
                >
                  {isItemNavigating("artist-categories") ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <Tag size={18} />
                      <span>Catégories d'artistes</span>
                    </>
                  ) : (
                    <>
                      <Tag size={18} />
                      <span>Catégories d'artistes</span>
                    </>
                  )}
                </a>
              </li>
              <li>
                <a
                  onClick={() =>
                    handleMenuNavigation(
                      "/dataAdministration/artwork-mediums",
                      "artwork-mediums"
                    )
                  }
                  className="flex items-center gap-2"
                >
                  {isItemNavigating("artwork-mediums") ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <Palette size={18} />
                      <span>Mediums d'œuvres</span>
                    </>
                  ) : (
                    <>
                      <Palette size={18} />
                      <span>Mediums d'œuvres</span>
                    </>
                  )}
                </a>
              </li>
              <li>
                <a
                  onClick={() =>
                    handleMenuNavigation(
                      "/dataAdministration/artwork-styles",
                      "artwork-styles"
                    )
                  }
                  className="flex items-center gap-2"
                >
                  {isItemNavigating("artwork-styles") ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <Brush size={18} />
                      <span>Styles d'œuvres</span>
                    </>
                  ) : (
                    <>
                      <Brush size={18} />
                      <span>Styles d'œuvres</span>
                    </>
                  )}
                </a>
              </li>
              <li>
                <a
                  onClick={() =>
                    handleMenuNavigation(
                      "/dataAdministration/artwork-techniques",
                      "artwork-techniques"
                    )
                  }
                  className="flex items-center gap-2"
                >
                  {isItemNavigating("artwork-techniques") ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <Wrench size={18} />
                      <span>Techniques d'œuvres</span>
                    </>
                  ) : (
                    <>
                      <Wrench size={18} />
                      <span>Techniques d'œuvres</span>
                    </>
                  )}
                </a>
              </li>
            </ul>
          </li>
          <li className="divider my-1"></li>
          <li>
            <a className="menu-title text-base-content/60 text-xs font-semibold tracking-widest flex items-center gap-2">
              <Shield size={16} />
              BACKOFFICE ADMIN
            </a>
            <ul className="p-2 bg-background-white dark:bg-background-white rounded-lg mt-1 border border-border dark:border-border">
              <li>
                <a
                  onClick={() =>
                    handleMenuNavigation("/boAdmin/users", "boUsers")
                  }
                  className="flex items-center gap-2"
                >
                  {isItemNavigating("boUsers") ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <Users size={18} />
                      <span>Gestion des Membres</span>
                    </>
                  ) : (
                    <>
                      <Users size={18} />
                      <span>Gestion des Membres</span>
                    </>
                  )}
                </a>
              </li>
              <li>
                <a
                  onClick={() =>
                    handleMenuNavigation(
                      "/boAdmin/create-member",
                      "createMember"
                    )
                  }
                  className="flex items-center gap-2"
                >
                  {isItemNavigating("createMember") ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <UserPlus size={18} />
                      <span>Créer un Membre</span>
                    </>
                  ) : (
                    <>
                      <UserPlus size={18} />
                      <span>Créer un Membre</span>
                    </>
                  )}
                </a>
              </li>
            </ul>
          </li>
          <li className="divider my-1"></li>
          {/* <li>
            <a className="menu-title text-base-content/60 text-xs font-semibold tracking-widest flex items-center gap-2">
              <Link size={16} />
              BLOCKCHAIN
            </a>
            <ul className="p-2 bg-background-white dark:bg-background-white rounded-lg mt-1 border border-border dark:border-border">
              <li>
                <a onClick={() => handleMenuNavigation('/blockchain/smartContracts', 'smartContracts')} className="flex items-center gap-2">
                  {isItemNavigating('smartContracts') ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <FileCode size={18} />
                      <span>Smart Contracts</span>
                    </>
                  ) : (
                    <>
                      <FileCode size={18} />
                      <span>Smart Contracts</span>
                    </>
                  )}
                </a>
              </li>
              <li>
                <a onClick={() => handleMenuNavigation('/blockchain/collections', 'collections')} className="flex items-center gap-2">
                  {isItemNavigating('collections') ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <Folder size={18} />
                      <span>Collections</span>
                    </>
                  ) : (
                    <>
                      <Folder size={18} />
                      <span>Collections</span>
                    </>
                  )}
                </a>
              </li>
              <li>
                <a onClick={() => handleMenuNavigation('/blockchain/royaltyBeneficiaries', 'royaltyBeneficiaries')} className="flex items-center gap-2">
                  {isItemNavigating('royaltyBeneficiaries') ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <Coins size={18} />
                      <span>Royalties</span>
                    </>
                  ) : (
                    <>
                      <Coins size={18} />
                      <span>Royalties</span>
                    </>
                  )}
                </a>
              </li>
            </ul>
          </li> */}
          <li className="divider my-1"></li>
          {/* <li>
            <a className="menu-title text-base-content/60 text-xs font-semibold tracking-widest flex items-center gap-2">
              <Store size={16} />
              MARKETPLACE
            </a>
            <ul className="p-2 bg-background-white dark:bg-background-white rounded-lg mt-1 border border-border dark:border-border">
              <li>
                <a onClick={() => handleMenuNavigation('/admin-art/createArtwork', 'adminCreateArtwork')} className="flex items-center gap-2">
                  {isItemNavigating('adminCreateArtwork') ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <PlusCircle size={18} />
                      <span>Créer une œuvre</span>
                    </>
                  ) : (
                    <>
                      <PlusCircle size={18} />
                      <span>Créer une œuvre</span>
                    </>
                  )}
                </a>
              </li>
              <li>
                <a onClick={() => handleMenuNavigation('/admin-art/collection', 'adminArtCollection')} className="flex items-center gap-2">
                  {isItemNavigating('adminArtCollection') ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <Folder size={18} />
                      <span>Collection d'œuvres</span>
                    </>
                  ) : (
                    <>
                      <Folder size={18} />
                      <span>Collection d'œuvres</span>
                    </>
                  )}
                </a>
              </li>
              <li>
                <a onClick={() => handleMenuNavigation('/marketplace/nftsToMint', 'nftsToMint')} className="flex items-center gap-2">
                  {isItemNavigating('nftsToMint') ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <Sparkles size={18} />
                      <span>NFTs à minter</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={18} />
                      <span>NFTs à minter</span>
                    </>
                  )}
                </a>
              </li>
              <li>
                <a onClick={() => handleMenuNavigation('/marketplace/royaltiesSettings', 'royaltiesSettings')} className="flex items-center gap-2">
                  {isItemNavigating('royaltiesSettings') ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <Coins size={18} />
                      <span>Royalties</span>
                    </>
                  ) : (
                    <>
                      <Coins size={18} />
                      <span>Royalties</span>
                    </>
                  )}
                </a>
              </li>
              <li>
                <a onClick={() => handleMenuNavigation('/marketplace/marketplaceListing', 'marketplaceListing')} className="flex items-center gap-2">
                  {isItemNavigating('marketplaceListing') ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <ShoppingBag size={18} />
                      <span>Marketplace Listing</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag size={18} />
                      <span>Marketplace Listing</span>
                    </>
                  )}
                </a>
              </li>
              <li>
                <a onClick={() => handleMenuNavigation('/marketplace/transactions', 'transactions')} className="flex items-center gap-2">
                  {isItemNavigating('transactions') ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <Receipt size={18} />
                      <span>Transactions Marketplace</span>
                    </>
                  ) : (
                    <>
                      <Receipt size={18} />
                      <span>Transactions Marketplace</span>
                    </>
                  )}
                </a>
              </li>
              <li>
                <a onClick={() => handleMenuNavigation('/marketplace/invoices', 'invoices')} className="flex items-center gap-2">
                  {isItemNavigating('invoices') ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <FileText size={18} />
                      <span>Factures</span>
                    </>
                  ) : (
                    <>
                      <FileText size={18} />
                      <span>Factures</span>
                    </>
                  )}
                </a>
              </li>
            </ul>
          </li> */}
          <li className="divider my-1"></li>
          <li>
            <a className="menu-title text-base-content/60 text-xs font-semibold tracking-widest flex items-center gap-2">
              <Wrench size={16} />
              TOOLS
            </a>
            <ul className="p-2 bg-background-white dark:bg-background-white rounded-lg mt-1 border border-border dark:border-border">
              <li>
                <a
                  onClick={() =>
                    handleMenuNavigation(
                      "/tools/webp-converter",
                      "toolsWebpConverter"
                    )
                  }
                  className="flex items-center gap-2"
                >
                  {isItemNavigating("toolsWebpConverter") ? (
                    <>
                      <span className="loading loading-spinner loading-sm"></span>
                      <Image size={18} />
                      <span>Convertisseur WebP</span>
                    </>
                  ) : (
                    <>
                      <Image size={18} />
                      <span>Convertisseur WebP</span>
                    </>
                  )}
                </a>
              </li>
            </ul>
          </li>
        </>
      );
    }
    return null;
  };

  return (
    <>
      {/* Menu hamburger pour mobile */}
      <div className="dropdown" ref={mobileMenuRef}>
        <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 6h16M4 12h8m-8 6h16"
            />
          </svg>
        </div>
        <ul
          tabIndex={0}
          className="menu menu-sm dropdown-content bg-background-white dark:bg-background-white backdrop-blur-md rounded-box z-[1] mt-3 w-52 p-2 shadow-2xl border-2 border-border dark:border-border"
        >
          {renderMobileMenuItems()}
        </ul>
      </div>

      {/* Menus desktop - centre */}
      <div className="navbar-center hidden lg:flex" ref={desktopMenuRef}>
        {/* Si l'utilisateur n'a pas d'artiste associé, afficher uniquement "Créer mon profil artiste" */}
        {canAccessCollection &&
          !isAdmin &&
          !isLoadingArtist &&
          !associatedArtist && (
            <ul className="menu menu-horizontal px-1">
              <li>
                <a
                  onClick={() =>
                    handleNavigation(
                      "/art/create-artist-profile",
                      "createArtistProfile"
                    )
                  }
                  className={`flex items-center gap-2 ${
                    activeItem === "createArtistProfile" ? "active" : ""
                  }`}
                >
                  <UserCircle size={18} />
                  Créer mon profil artiste
                </a>
              </li>
            </ul>
          )}

        {/* Menu utilisateur normal */}
        {canAccessCollection &&
          !isAdmin &&
          !isLoadingArtist &&
          associatedArtist && (
            <ul className="menu menu-horizontal px-1">
              <li>
                <a
                  onClick={() => handleNavigation("/dashboard", "dashboard")}
                  className={`flex items-center gap-2 ${
                    activeItem === "dashboard" ? "active" : ""
                  }`}
                >
                  <LayoutDashboard size={18} />
                  Dashboard
                </a>
              </li>
              {/* Bloc Profil */}
              <li>
                <details>
                  <summary className="flex items-center gap-2">
                    <UserCircle size={18} />
                    Profil
                  </summary>
                  <ul className="bg-background-white dark:bg-background-white backdrop-blur-md rounded-t-none p-2 shadow-2xl border-2 border-border dark:border-border">
                    <li>
                      <a
                        onClick={() =>
                          handleNavigation(
                            "/art/edit-artist-profile",
                            "editArtistProfile"
                          )
                        }
                        className="flex items-center gap-2"
                      >
                        <UserCircle size={18} />
                        Éditer mon profil
                      </a>
                    </li>
                  </ul>
                </details>
              </li>
              {/* Bloc Site web InRealArt */}
              <li>
                <details>
                  <summary className="flex items-center gap-2">
                    <Globe size={18} />
                    Site web InRealArt
                  </summary>
                  <ul className="bg-background-white dark:bg-background-white backdrop-blur-md rounded-t-none p-2 shadow-2xl border-2 border-border dark:border-border">
                    <li>
                      <a
                        onClick={() =>
                          handleNavigation(
                            "/art/create-presale-artwork",
                            "createPresaleArtwork"
                          )
                        }
                        className="flex items-center gap-2"
                      >
                        <PlusCircle size={18} />
                        Créer une œuvre
                      </a>
                    </li>
                    <li>
                      <a
                        onClick={() =>
                          handleNavigation("/art/my-artworks", "myArtworks")
                        }
                        className="flex items-center gap-2"
                      >
                        <Image size={18} />
                        Voir mes œuvres
                      </a>
                    </li>
                  </ul>
                </details>
              </li>
              {/* Bloc Marketplace */}
              <li>
                <details>
                  <summary className="flex items-center gap-2">
                    <Store size={18} />
                    Marketplace
                  </summary>
                  <ul className="bg-background-white dark:bg-background-white backdrop-blur-md rounded-t-none p-2 shadow-2xl border-2 border-border dark:border-border">
                    <li>
                      <a
                        onClick={() =>
                          handleNavigation(
                            "/art/myPhysicalArtwork",
                            "myPhysicalArtwork"
                          )
                        }
                        className="flex items-center gap-2"
                      >
                        <Image size={18} />
                        Voir mes œuvres
                      </a>
                    </li>
                    <li>
                      <a
                        onClick={() =>
                          handleNavigation(
                            "/art/physicalCollection",
                            "physicalCollection"
                          )
                        }
                        className="flex items-center gap-2"
                      >
                        <Folder size={18} />
                        Voir mes collections
                      </a>
                    </li>
                  </ul>
                </details>
              </li>
            </ul>
          )}

        {/* Menu administrateur */}
        {isAdmin && (
          <ul className="menu menu-horizontal px-1">
            <li>
              <a
                onClick={() => handleNavigation("/dashboard", "dashboard")}
                className={`flex items-center gap-2 ${
                  activeItem === "dashboard" ? "active" : ""
                }`}
              >
                <LayoutDashboard size={18} />
                Dashboard
              </a>
            </li>
            <li>
              <details>
                <summary className="flex items-center gap-2">
                  <Globe size={18} />
                  Landing
                </summary>
                <ul className="bg-background-white dark:bg-background-white backdrop-blur-md rounded-t-none p-2 shadow-2xl border-2 border-border dark:border-border w-60 max-h-80 overflow-y-auto">
                  <li>
                    <a
                      onClick={() =>
                        handleNavigation("/landing/languages", "languages")
                      }
                      className="flex items-center gap-2"
                    >
                      <Languages size={18} />
                      Languages
                    </a>
                  </li>
                  <li>
                    <a
                      onClick={() =>
                        handleNavigation(
                          "/landing/translations",
                          "translations"
                        )
                      }
                      className="flex items-center gap-2"
                    >
                      <FileText size={18} />
                      Translations
                    </a>
                  </li>
                  <li>
                    <a
                      onClick={() => handleNavigation("/landing/team", "team")}
                      className="flex items-center gap-2"
                    >
                      <Users size={18} />
                      Team
                    </a>
                  </li>
                  <li>
                    <a
                      onClick={() => handleNavigation("/landing/faq", "faq")}
                      className="flex items-center gap-2"
                    >
                      <HelpCircle size={18} />
                      FAQ
                    </a>
                  </li>
                  <li>
                    <a
                      onClick={() =>
                        handleNavigation("/landing/detailedFaq", "detailedFaq")
                      }
                      className="flex items-center gap-2"
                    >
                      <FileText size={18} />
                      FAQ détaillée
                    </a>
                  </li>
                  <li>
                    <a
                      onClick={() =>
                        handleNavigation(
                          "/landing/detailedFaqPage",
                          "detailedFaqPage"
                        )
                      }
                      className="flex items-center gap-2"
                    >
                      <BookOpen size={18} />
                      FAQ par page
                    </a>
                  </li>
                  <li>
                    <a
                      onClick={() =>
                        handleNavigation(
                          "/landing/detailedGlossary",
                          "detailedGlossary"
                        )
                      }
                      className="flex items-center gap-2"
                    >
                      <BookOpen size={18} />
                      Glossaire détaillé
                    </a>
                  </li>
                  <li>
                    <a
                      onClick={() =>
                        handleNavigation(
                          "/landing/landingArtists",
                          "landingArtists"
                        )
                      }
                      className="flex items-center gap-2"
                    >
                      <Users size={18} />
                      Page artistes
                    </a>
                  </li>
                  <li>
                    <a
                      onClick={() =>
                        handleNavigation(
                          "/landing/presaleArtworks",
                          "presaleArtworks"
                        )
                      }
                      className="flex items-center gap-2"
                    >
                      <ShoppingCart size={18} />
                      Œuvres en prévente
                    </a>
                  </li>
                  <li>
                    <a
                      onClick={() => handleNavigation("/landing/blog", "blog")}
                      className="flex items-center gap-2"
                    >
                      <FileText size={18} />
                      Articles de blog
                    </a>
                  </li>
                </ul>
              </details>
            </li>
            <li>
              <details>
                <summary className="flex items-center gap-2">
                  <Database size={18} />
                  Data
                </summary>
                <ul className="bg-background-white dark:bg-background-white backdrop-blur-md rounded-t-none p-2 shadow-2xl border-2 border-border dark:border-border w-60">
                  <li>
                    <a
                      onClick={() =>
                        handleNavigation(
                          "/dataAdministration/artists",
                          "artists"
                        )
                      }
                      className="flex items-center gap-2"
                    >
                      <Users size={18} />
                      Artistes
                    </a>
                  </li>
                  <li>
                    <a
                      onClick={() =>
                        handleNavigation(
                          "/dataAdministration/artist-categories",
                          "artist-categories"
                        )
                      }
                      className="flex items-center gap-2"
                    >
                      <Tag size={18} />
                      Catégories d'artistes
                    </a>
                  </li>
                  <li>
                    <a
                      onClick={() =>
                        handleNavigation(
                          "/dataAdministration/artwork-mediums",
                          "artwork-mediums"
                        )
                      }
                      className="flex items-center gap-2"
                    >
                      <Palette size={18} />
                      Mediums d'œuvres
                    </a>
                  </li>
                  <li>
                    <a
                      onClick={() =>
                        handleNavigation(
                          "/dataAdministration/artwork-styles",
                          "artwork-styles"
                        )
                      }
                      className="flex items-center gap-2"
                    >
                      <Brush size={18} />
                      Styles d'œuvres
                    </a>
                  </li>
                  <li>
                    <a
                      onClick={() =>
                        handleNavigation(
                          "/dataAdministration/artwork-techniques",
                          "artwork-techniques"
                        )
                      }
                      className="flex items-center gap-2"
                    >
                      <Wrench size={18} />
                      Techniques d'œuvres
                    </a>
                  </li>
                </ul>
              </details>
            </li>
            <li>
              <details>
                <summary className="flex items-center gap-2">
                  <Shield size={18} />
                  Admin
                </summary>
                <ul className="bg-background-white dark:bg-background-white backdrop-blur-md rounded-t-none p-2 shadow-2xl border-2 border-border dark:border-border">
                  <li>
                    <a
                      onClick={() =>
                        handleNavigation("/boAdmin/users", "boUsers")
                      }
                      className="flex items-center gap-2"
                    >
                      <Users size={18} />
                      Gestion des Membres
                    </a>
                  </li>
                  <li>
                    <a
                      onClick={() =>
                        handleNavigation(
                          "/boAdmin/create-member",
                          "createMember"
                        )
                      }
                      className="flex items-center gap-2"
                    >
                      <UserPlus size={18} />
                      Créer un Membre
                    </a>
                  </li>
                </ul>
              </details>
            </li>
            <li>
              <details>
                <summary className="flex items-center gap-2">
                  <Link size={18} />
                  Blockchain
                </summary>
                <ul className="bg-background-white dark:bg-background-white backdrop-blur-md rounded-t-none p-2 shadow-2xl border-2 border-border dark:border-border">
                  <li>
                    <a
                      onClick={() =>
                        handleNavigation(
                          "/blockchain/smartContracts",
                          "smartContracts"
                        )
                      }
                      className="flex items-center gap-2"
                    >
                      <FileCode size={18} />
                      Smart Contracts
                    </a>
                  </li>
                  <li>
                    <a
                      onClick={() =>
                        handleNavigation(
                          "/blockchain/collections",
                          "collections"
                        )
                      }
                      className="flex items-center gap-2"
                    >
                      <Folder size={18} />
                      Collections
                    </a>
                  </li>
                  <li>
                    <a
                      onClick={() =>
                        handleNavigation(
                          "/blockchain/royaltyBeneficiaries",
                          "royaltyBeneficiaries"
                        )
                      }
                      className="flex items-center gap-2"
                    >
                      <Coins size={18} />
                      Royalties
                    </a>
                  </li>
                </ul>
              </details>
            </li>
            <li>
              <details>
                <summary className="flex items-center gap-2">
                  <Store size={18} />
                  Marketplace
                </summary>
                <ul className="bg-background-white dark:bg-background-white backdrop-blur-md rounded-t-none p-2 shadow-2xl border-2 border-border dark:border-border w-60">
                  <li>
                    <a
                      onClick={() =>
                        handleNavigation(
                          "/admin-art/createArtwork",
                          "adminCreateArtwork"
                        )
                      }
                      className="flex items-center gap-2"
                    >
                      <PlusCircle size={18} />
                      Créer une œuvre
                    </a>
                  </li>
                  <li>
                    <a
                      onClick={() =>
                        handleNavigation(
                          "/admin-art/collection",
                          "adminArtCollection"
                        )
                      }
                      className="flex items-center gap-2"
                    >
                      <Folder size={18} />
                      Collection d'œuvres
                    </a>
                  </li>
                  <li>
                    <a
                      onClick={() =>
                        handleNavigation(
                          "/marketplace/nftsToMint",
                          "nftsToMint"
                        )
                      }
                      className="flex items-center gap-2"
                    >
                      <Sparkles size={18} />
                      NFTs à minter
                    </a>
                  </li>
                  <li>
                    <a
                      onClick={() =>
                        handleNavigation(
                          "/marketplace/royaltiesSettings",
                          "royaltiesSettings"
                        )
                      }
                      className="flex items-center gap-2"
                    >
                      <Coins size={18} />
                      Royalties
                    </a>
                  </li>
                  <li>
                    <a
                      onClick={() =>
                        handleNavigation(
                          "/marketplace/marketplaceListing",
                          "marketplaceListing"
                        )
                      }
                      className="flex items-center gap-2"
                    >
                      <ShoppingBag size={18} />
                      Marketplace Listing
                    </a>
                  </li>
                  <li>
                    <a
                      onClick={() =>
                        handleNavigation(
                          "/marketplace/transactions",
                          "transactions"
                        )
                      }
                      className="flex items-center gap-2"
                    >
                      <Receipt size={18} />
                      Transactions Marketplace
                    </a>
                  </li>
                  <li>
                    <a
                      onClick={() =>
                        handleNavigation("/marketplace/invoices", "invoices")
                      }
                      className="flex items-center gap-2"
                    >
                      <FileText size={18} />
                      Factures
                    </a>
                  </li>
                </ul>
              </details>
            </li>
            <li>
              <details>
                <summary className="flex items-center gap-2">
                  <Wrench size={18} />
                  Tools
                </summary>
                <ul className="bg-background-white dark:bg-background-white backdrop-blur-md rounded-t-none p-2 shadow-2xl border-2 border-border dark:border-border">
                  <li>
                    <a
                      onClick={() =>
                        handleNavigation(
                          "/tools/webp-converter",
                          "toolsWebpConverter"
                        )
                      }
                      className="flex items-center gap-2"
                    >
                      <Image size={18} />
                      Convertisseur WebP
                    </a>
                  </li>
                </ul>
              </details>
            </li>
          </ul>
        )}
      </div>
    </>
  );
}
