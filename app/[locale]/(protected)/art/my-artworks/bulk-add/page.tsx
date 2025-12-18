import { getAuthenticatedUserEmail } from "@/lib/auth-helpers";
import { getBackofficeUserByEmail, getArtistById } from "@/lib/actions/prisma-actions";
import { redirect } from "next/navigation";
import BulkAddForm from "@/app/(admin)/landing/presaleArtworks/bulk-add/BulkAddForm";

export const metadata = {
  title: "Ajout en masse d'œuvres en prévente | Site web InRealArt",
  description: "Ajoutez plusieurs œuvres en prévente en une seule fois",
};

export default async function ArtistBulkAddPage() {
  const userEmail = await getAuthenticatedUserEmail();

  // Récupérer l'utilisateur backoffice
  const backofficeUser = await getBackofficeUserByEmail(userEmail);

  if (!backofficeUser || !backofficeUser.artistId) {
    // Rediriger vers la page de création si l'utilisateur n'a pas de profil artiste
    redirect("/art/create-artist-profile");
  }

  // Récupérer l'artiste connecté
  const artist = await getArtistById(backofficeUser.artistId);

  if (!artist) {
    redirect("/art/create-artist-profile");
  }

  // Passer uniquement l'artiste connecté au formulaire
  return (
    <BulkAddForm 
      artists={[artist]} 
      defaultArtistId={artist.id}
      cancelRedirectUrl="/art/my-artworks"
      successRedirectUrl="/art/my-artworks"
    />
  );
}

