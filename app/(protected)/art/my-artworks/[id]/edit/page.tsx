import PresaleArtworkForm from "@/app/components/PresaleArtworkForm/PresaleArtworkForm";
import { getPresaleArtworkById } from "@/lib/actions/presale-artwork-actions";
import { getAuthenticatedUserEmail } from "@/lib/auth-helpers";
import { getBackofficeUserByEmail } from "@/lib/actions/prisma-actions";
import { notFound, redirect } from "next/navigation";

export const metadata = {
  title: "Modifier une œuvre en prévente | Site web InRealArt",
  description: "Modification d'une œuvre en prévente existante",
};

interface EditPresaleArtworkPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditPresaleArtworkPage({
  params,
}: EditPresaleArtworkPageProps) {
  const userEmail = await getAuthenticatedUserEmail();
  const backofficeUser = await getBackofficeUserByEmail(userEmail);

  if (!backofficeUser || !backofficeUser.artistId) {
    redirect("/art/create-artist-profile");
  }

  const resolvedParams = await params;
  const presaleArtworkId = parseInt(resolvedParams.id, 10);

  if (isNaN(presaleArtworkId)) {
    notFound();
  }

  const presaleArtwork = await getPresaleArtworkById(presaleArtworkId);

  if (!presaleArtwork) {
    notFound();
  }

  // Vérifier que l'œuvre appartient à l'artiste connecté
  if (presaleArtwork.artistId !== backofficeUser.artistId) {
    redirect("/art/my-artworks");
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Modifier une œuvre en prévente</h1>
        <p className="page-subtitle">
          Modification de l'œuvre: {presaleArtwork.name}
        </p>
      </div>

      <div className="page-content">
        <PresaleArtworkForm
          mode="edit"
          presaleArtworkId={presaleArtworkId}
          defaultArtistId={backofficeUser.artistId}
          redirectUrl="/art/my-artworks"
        />
      </div>
    </div>
  );
}









