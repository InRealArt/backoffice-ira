import { getAllPresaleArtworks } from "@/lib/actions/presale-artwork-actions";
import DisplayOrderManager from "@/app/components/art/DisplayOrderManager";
import { loadPresaleArtworksSearchParams } from "../searchParams";
import type { SearchParams } from "nuqs/server";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Ordre d'affichage | Administration",
  description: "Réorganisez l'ordre d'affichage des œuvres d'un artiste",
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function DisplayOrderPage({ searchParams }: PageProps) {
  // Charger les paramètres de recherche côté serveur
  const { artistId } = await loadPresaleArtworksSearchParams(searchParams);

  // Rediriger si aucun artistId n'est fourni
  if (!artistId) {
    redirect("/landing/presaleArtworks");
  }

  // Récupérer toutes les œuvres
  const presaleArtworksData = await getAllPresaleArtworks();

  // Filtrer uniquement les œuvres de l'artiste sélectionné
  const filteredArtworks = presaleArtworksData.filter(
    (artwork) => artwork.artistId === artistId
  );

  return (
    <div className="page-container">
      <DisplayOrderManager
        artworks={filteredArtworks}
        artistId={artistId}
        backUrl={`/landing/presaleArtworks?artistId=${artistId}`}
        revalidatePaths={[
          "/landing/presaleArtworks",
          "/landing/presaleArtworks/display-order",
        ]}
      />
    </div>
  );
}
