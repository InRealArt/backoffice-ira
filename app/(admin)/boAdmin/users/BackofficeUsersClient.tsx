"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { WhiteListedUser, Artist } from "@prisma/client";
import LoadingSpinner from "@/app/components/LoadingSpinner/LoadingSpinner";
import {
  PageContainer,
  PageHeader,
  PageContent,
  EmptyState,
  ActionButton,
} from "../../../components/PageLayout/index";

// Type étendu pour inclure la relation artist
type WhiteListedUserWithArtist = WhiteListedUser & {
  artist: Artist | null;
};

interface BackofficeUsersClientProps {
  users: WhiteListedUserWithArtist[];
}

export default function BackofficeUsersClient({
  users,
}: BackofficeUsersClientProps) {
  const [isMobile, setIsMobile] = useState(false);
  const router = useRouter();
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Force le rafraîchissement des données au montage du composant
  useEffect(() => {
    router.refresh();
  }, [router]);

  // Détecte si l'écran est de taille mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Vérifier au chargement
    checkIfMobile();

    // Écouter les changements de taille d'écran
    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  const handleUserClick = (user: WhiteListedUserWithArtist) => {
    setLoadingUserId(user.id.toString());
    router.push(`/boAdmin/users/${user.id}/edit`);
  };

  const handleCreateUser = () => {
    setIsCreatingUser(true);
    router.push("/boAdmin/create-member");
  };

  // Fonction pour forcer un rechargement complet des données
  const handleRefresh = () => {
    setIsRefreshing(true);
    // Utiliser router.refresh pour recharger les données du serveur
    router.refresh();
    // Attendre un court délai pour éviter un rafraîchissement trop rapide de l'interface
    setTimeout(() => {
      // Pour être vraiment sûr, on peut forcer un rechargement complet de la page
      window.location.reload();
    }, 100);
  };

  // Fonction pour déterminer la classe du badge DaisyUI selon le rôle
  const getRoleBadgeClass = (role: string | null): string => {
    const baseClasses =
      "badge rounded-lg px-3 py-1.5 font-medium text-white border-none";

    if (!role) return `${baseClasses} bg-gray-500`;

    const roleLC = role.toLowerCase();

    switch (roleLC) {
      case "admin":
      case "administrateur":
        return `${baseClasses} bg-green-500 hover:bg-green-600`;
      case "artist":
      case "artiste":
        return `${baseClasses} bg-blue-500 hover:bg-blue-600`;
      case "gallerymanager":
      case "gallery manager":
        return `${baseClasses} bg-blue-500 hover:bg-blue-600`;
      default:
        return `${baseClasses} bg-gray-500`;
    }
  };

  // Fonction pour obtenir le texte affiché selon le rôle
  const getRoleText = (role: string | null): string => {
    if (!role) return "Utilisateur";

    const roleLC = role.toLowerCase();

    switch (roleLC) {
      case "admin":
      case "administrateur":
        return "Admin";
      case "artist":
      case "artiste":
        return "Artiste";
      case "gallerymanager":
      case "gallery manager":
        return "Resp. galerie";
      default:
        return "Utilisateur";
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Utilisateurs Back-office"
        subtitle={`Liste des utilisateurs enregistrés dans le Back-office (${
          users.length
        } utilisateur${users.length > 1 ? "s" : ""})`}
        actions={
          <div className="d-flex gap-sm">
            <ActionButton
              label={isRefreshing ? "Actualisation..." : "Actualiser la liste"}
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="secondary"
              size="medium"
              isLoading={isRefreshing}
            />
            <ActionButton
              label={
                isCreatingUser
                  ? "Création..."
                  : "Créer un utilisateur de backoffice"
              }
              onClick={handleCreateUser}
              disabled={isCreatingUser}
              size="medium"
              isLoading={isCreatingUser}
            />
          </div>
        }
      />

      <PageContent>
        {users.length === 0 ? (
          <EmptyState
            message="Aucun utilisateur Back-office trouvé"
            action={
              <ActionButton
                label="Créer un utilisateur"
                onClick={handleCreateUser}
                variant="primary"
              />
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th className="hidden md:table-cell">ID</th>
                  <th>Email</th>
                  <th>Rôle</th>
                  <th>Artiste</th>
                  <th>Galerie</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    onClick={() => handleUserClick(user)}
                    className="cursor-pointer hover:bg-base-200"
                  >
                    <td className="hidden md:table-cell">{user.id}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        {loadingUserId === user.id.toString() && (
                          <LoadingSpinner size="small" message="" inline />
                        )}
                        <span
                          className={
                            loadingUserId === user.id.toString()
                              ? "opacity-50"
                              : ""
                          }
                        >
                          {user.email}
                        </span>
                      </div>
                    </td>
                    <td>
                      <span className={getRoleBadgeClass(user.role)}>
                        {getRoleText(user.role)}
                      </span>
                    </td>
                    <td>
                      {user.artist ? (
                        <span className="text-sm">
                          {user.artist.name} {user.artist.surname}
                        </span>
                      ) : (
                        <span className="text-base-content/50 text-sm">-</span>
                      )}
                    </td>
                    <td>
                      {user.artist?.isGallery ? (
                        <span className="badge badge-info badge-sm">
                          Galerie
                        </span>
                      ) : (
                        <span className="text-base-content/50 text-sm">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageContent>
    </PageContainer>
  );
}
