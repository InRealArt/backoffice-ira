import { getArtistsWithPresaleArtworkCount } from "@/lib/actions/artist-actions";
import InventoryClient from "./InventoryClient";
import { loadInventorySearchParams } from "./searchParams";
import type { SearchParams } from "nuqs/server";

// Désactive le cache pour cette route afin de toujours avoir les données à jour
export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function InventoryPage({ searchParams }: PageProps) {
  // Charger les paramètres de recherche côté serveur
  const { name } = await loadInventorySearchParams(searchParams);

  const artists = await getArtistsWithPresaleArtworkCount(name || undefined);

  return <InventoryClient artists={artists} />;
}
