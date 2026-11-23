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
import styles from "./EditArtistProfile.module.scss";

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
    <div className={styles.page}>
      <header className={styles.header}>
        {artist.pseudo && <p className={styles.eyebrow}>{artist.pseudo}</p>}
        <h1 className={styles.title}>{t("title")}</h1>
        <p className={styles.subtitle}>{t("subtitle")}</p>
      </header>

      <div className={styles.card}>
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
