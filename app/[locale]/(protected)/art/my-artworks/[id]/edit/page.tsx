import PresaleArtworkForm from "@/app/components/PresaleArtworkForm/PresaleArtworkForm";
import { getPresaleArtworkById } from "@/lib/actions/presale-artwork-actions";
import { getAuthenticatedUserEmail } from "@/lib/auth-helpers";
import { getBackofficeUserByEmail } from "@/lib/actions/prisma-actions";
import { FormCard, FormPage, FormPageHeader } from "@/app/components/Forms/FormKit/FormKit";
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
    <FormPage>
      <FormPageHeader
        eyebrow={presaleArtwork.name}
        title="Modifier une œuvre en prévente"
        subtitle="Modifiez les informations de votre œuvre en prévente."
      />

      <FormCard>
        <PresaleArtworkForm
          mode="edit"
          presaleArtworkId={presaleArtworkId}
          defaultArtistId={backofficeUser.artistId}
          redirectUrl="/art/my-artworks"
          showFeatured={false}
        />
      </FormCard>
    </FormPage>
  );
}

















