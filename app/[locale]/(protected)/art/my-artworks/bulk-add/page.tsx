import { getAuthenticatedUserEmail } from "@/lib/auth-helpers";
import { getBackofficeUserByEmail, getArtistById } from "@/lib/actions/prisma-actions";
import { redirect } from "next/navigation";
import BulkAddForm from "@/app/(admin)/landing/presaleArtworks/bulk-add/BulkAddForm";
import { getTranslations } from "next-intl/server";

export async function generateMetadata() {
  const t = await getTranslations("art.bulkAddPage");
  
  return {
    title: t("title"),
    description: t("description"),
  };
}

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

