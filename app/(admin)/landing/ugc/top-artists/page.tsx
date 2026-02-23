import {
  getTopArtists,
  getAllLandingArtistsWithTopStatus,
} from "@/lib/actions/landing-ugc-actions";
import TopArtistsClient from "./TopArtistsClient";
import type { TopArtistSortableItem } from "@/app/components/SortableList/SortableTopArtistItem";

export const metadata = {
  title: "Top Artistes UGC | Administration",
  description:
    "Sélectionnez et ordonnez les artistes mis en avant dans la section UGC du site",
};

export default async function TopArtistsPage() {
  const [topArtistsRaw, allLandingArtists] = await Promise.all([
    getTopArtists(),
    getAllLandingArtistsWithTopStatus(),
  ]);

  // IDs already selected
  const topLandingArtistIds = new Set(
    topArtistsRaw.map((t) => t.landingArtistId)
  );

  // Shape top artists for the client
  const topArtists: TopArtistSortableItem[] = topArtistsRaw.map((t) => ({
    id: t.id,
    landingArtistId: t.landingArtistId,
    order: t.order,
    landingArtist: {
      id: t.landingArtist.id,
      imageUrl: t.landingArtist.imageUrl,
      artist: {
        name: t.landingArtist.artist.name,
        surname: t.landingArtist.artist.surname,
        pseudo: t.landingArtist.artist.pseudo,
      },
    },
  }));

  // Artists not yet in the top list
  const availableArtists = allLandingArtists
    .filter((la) => !topLandingArtistIds.has(la.id))
    .map((la) => ({
      id: la.id,
      imageUrl: la.imageUrl,
      artist: {
        name: la.artist.name,
        surname: la.artist.surname,
        pseudo: la.artist.pseudo,
      },
    }));

  return (
    <TopArtistsClient
      initialTopArtists={topArtists}
      availableArtists={availableArtists}
    />
  );
}
