import { getAuthenticatedUserEmail } from "@/lib/auth-helpers";
import {
  getBackofficeUserByEmail,
  getArtistById,
} from "@/lib/actions/prisma-actions";
import {
  getLandingArtistByArtistId,
  getArtistAwards,
  getArtistSpecialties,
} from "@/lib/actions/artist-actions";
import { getAllArtistSpecialties } from "@/lib/actions/artist-specialty-actions";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import EditArtistProfileForm from "./EditArtistProfileForm";
import { FormCard, FormPage, FormPageHeader } from "@/app/components/Forms/FormKit/FormKit";

export default async function EditArtistProfilePage() {
  const t = await getTranslations("art.editArtistProfilePage");
  const userEmail = await getAuthenticatedUserEmail();

  // Récupérer l'utilisateur backoffice
  const backofficeUser = await getBackofficeUserByEmail(userEmail);

  if (!backofficeUser || !backofficeUser.artistId) {
    // Rediriger vers la page de création si l'utilisateur n'a pas de profil artiste
    redirect("/art/create-artist-profile");
  }

  // Récupérer l'artiste, le LandingArtist, les récompenses et les spécialités
  const [artist, landingArtist, awards, artistSpecialtyIds, allSpecialties] =
    await Promise.all([
      getArtistById(backofficeUser.artistId),
      getLandingArtistByArtistId(backofficeUser.artistId),
      getArtistAwards(backofficeUser.artistId),
      getArtistSpecialties(backofficeUser.artistId),
      getAllArtistSpecialties(),
    ]);

  if (!artist) {
    notFound();
  }

  return (
    <FormPage>
      <FormPageHeader
        eyebrow={artist.pseudo}
        title={t("title")}
        subtitle={t("subtitle")}
      />
      <FormCard>
        <EditArtistProfileForm
          artist={artist}
          landingArtist={landingArtist}
          awards={awards.map((award) => ({
            id: award.id,
            name: award.name,
            description: award.description,
            year: award.year,
          }))}
          specialtyIds={artistSpecialtyIds}
          allSpecialties={allSpecialties}
        />
      </FormCard>
    </FormPage>
  );
}
