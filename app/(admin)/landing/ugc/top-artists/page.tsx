import {
  getTopArtists,
  getAllUgcArtistProfilesWithTopStatus,
} from "@/lib/actions/landing-ugc-actions";
import TopArtistsClient from "./TopArtistsClient";
import type { TopArtistSortableItem } from "@/app/components/SortableList/SortableTopArtistItem";

export const metadata = {
  title: "Top Artistes UGC | Administration",
  description:
    "Sélectionnez et ordonnez les artistes mis en avant dans la section UGC du site",
};

export default async function TopArtistsPage() {
  const [topArtistsRaw, { profiles, topProfileIds }] = await Promise.all([
    getTopArtists(),
    getAllUgcArtistProfilesWithTopStatus(),
  ]);

  // Shape top artists for the client
  const topArtists: TopArtistSortableItem[] = topArtistsRaw
    .filter((t) => t.landingUgcArtistProfile !== null)
    .map((t) => ({
      id: t.id,
      ugcArtistProfileId: t.landingUgcArtistProfileId!,
      order: t.order,
      ugcArtistProfile: {
        id: t.landingUgcArtistProfile!.id,
        profileImageUrl: t.landingUgcArtistProfile!.profileImageUrl,
        name: t.landingUgcArtistProfile!.name,
        surname: t.landingUgcArtistProfile!.surname,
        pseudo: t.landingUgcArtistProfile!.pseudo,
      },
    }));

  // Profiles not yet in the top list
  const availableProfiles = profiles
    .filter((p) => !topProfileIds.has(p.id))
    .map((p) => ({
      id: p.id,
      profileImageUrl: p.profileImageUrl,
      name: p.name,
      surname: p.surname,
      pseudo: p.pseudo,
    }));

  return (
    <TopArtistsClient
      initialTopArtists={topArtists}
      availableProfiles={availableProfiles}
    />
  );
}
