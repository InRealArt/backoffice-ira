import { getAuthenticatedUserEmail } from "@/lib/auth-helpers";
import { getBackofficeUserByEmail } from "@/lib/actions/prisma-actions";
import { redirect } from "next/navigation";
import { getAllPresaleArtworks } from "@/lib/actions/presale-artwork-actions";
import DisplayOrderManager from "../DisplayOrderManager";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("art.displayOrderPage");

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function DisplayOrderPage() {
  const userEmail = await getAuthenticatedUserEmail();

  // Récupérer l'utilisateur backoffice
  const backofficeUser = await getBackofficeUserByEmail(userEmail);

  if (!backofficeUser || !backofficeUser.artistId) {
    // Rediriger vers la page de création si l'utilisateur n'a pas de profil artiste
    redirect("/art/create-artist-profile");
  }

  const artistId = backofficeUser.artistId;

  // Récupérer toutes les œuvres
  const presaleArtworksData = await getAllPresaleArtworks();

  // Filtrer uniquement les œuvres de l'artiste connecté
  const filteredArtworks = presaleArtworksData.filter(
    (artwork) => artwork.artistId === artistId
  );

  return (
    <div className="page-container">
      <DisplayOrderManager artworks={filteredArtworks} artistId={artistId} />
    </div>
  );
}
