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
    <div className="w-full max-w-7xl mx-auto">
      <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            {t("title")}
            {artist.pseudo && (
              <span className="font-semibold text-primary dark:text-primary">
                {" "}
                - {artist.pseudo}
              </span>
            )}
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400">
            {t("subtitle")}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 pt-6 sm:pt-8 md:pt-10 pr-6 sm:pr-8 md:pr-10 pb-6 sm:pb-8 md:pb-10 overflow-hidden">
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
      </div>
    </div>
  );
}
