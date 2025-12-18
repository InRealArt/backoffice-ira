import { getAuthenticatedUserEmail } from "@/lib/auth-helpers";
import { getBackofficeUserByEmail } from "@/lib/actions/prisma-actions";
import { redirect } from "next/navigation";
import { getAllPresaleArtworks } from "@/lib/actions/presale-artwork-actions";
import PresaleArtworksClient from "@/app/(admin)/landing/presaleArtworks/PresaleArtworksClient";
import { loadPresaleArtworksSearchParams } from "@/app/(admin)/landing/presaleArtworks/searchParams";
import type { SearchParams } from "nuqs/server";

export const metadata = {
  title: "Mes œuvres en prévente | Marketplace",
  description: "Gérez vos œuvres en prévente",
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function ArtistPresaleArtworksPage({
  searchParams,
}: PageProps) {
  const userEmail = await getAuthenticatedUserEmail();

  // Récupérer l'utilisateur backoffice
  const backofficeUser = await getBackofficeUserByEmail(userEmail);

  if (!backofficeUser || !backofficeUser.artistId) {
    // Rediriger vers la page de création si l'utilisateur n'a pas de profil artiste
    redirect("/art/create-artist-profile");
  }

  const artistId = backofficeUser.artistId;

  // Charger les paramètres de recherche côté serveur
  const { sortColumn, sortDirection, page, itemsPerPage } =
    await loadPresaleArtworksSearchParams(searchParams);

  // Récupérer toutes les œuvres (on filtrera par artistId côté serveur)
  const presaleArtworksData = await getAllPresaleArtworks();

  // Transformer les données pour s'assurer que 'order' est toujours un nombre
  const presaleArtworks = presaleArtworksData.map((artwork) => ({
    ...artwork,
    order: artwork.order ?? 0, // Utiliser 0 comme valeur par défaut si null
  }));

  // Filtrer uniquement les œuvres de l'artiste connecté
  const filteredArtworks = presaleArtworks.filter(
    (artwork) => artwork.artistId === artistId
  );

  // Trier les œuvres côté serveur
  const sortedArtworks = [...filteredArtworks].sort((a, b) => {
    const valueA = (a as any)[sortColumn] ?? 0;
    const valueB = (b as any)[sortColumn] ?? 0;

    if (sortDirection === "asc") {
      return typeof valueA === "string"
        ? valueA.localeCompare(valueB)
        : valueA - valueB;
    } else {
      return typeof valueA === "string"
        ? valueB.localeCompare(valueA)
        : valueB - valueA;
    }
  });

  // Calculer la pagination côté serveur
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedArtworks = sortedArtworks.slice(startIndex, endIndex);

  // Pour le client, on passe un tableau vide d'artistes car le filtre n'est pas nécessaire
  // (on affiche uniquement les œuvres de l'artiste connecté)
  return (
    <PresaleArtworksClient
      presaleArtworks={paginatedArtworks}
      totalItems={sortedArtworks.length}
      currentPage={page}
      itemsPerPage={itemsPerPage}
      selectedArtistId={artistId} // Pré-sélectionner l'artiste connecté
      sortColumn={sortColumn}
      sortDirection={sortDirection}
      allArtists={[]} // Pas besoin de la liste des artistes car on filtre déjà
      isArtistMode={true}
      editRouteBase="/art/presale-artworks"
      createRouteBase="/art/create-presale-artwork"
    />
  );
}
