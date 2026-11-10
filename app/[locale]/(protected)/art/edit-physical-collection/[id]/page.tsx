import { getAuthenticatedUserEmail } from "@/lib/auth-helpers";
import { getBackofficeUserByEmail } from "@/lib/actions/prisma-actions";
import { redirect, notFound } from "next/navigation";
import { getPhysicalCollectionById } from "@/lib/actions/physical-collection-actions";
import { FormCard, FormPage, FormPageHeader } from "@/app/components/Forms/FormKit/FormKit";
import EditPhysicalCollectionForm from "./EditPhysicalCollectionForm";

interface EditPhysicalCollectionPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditPhysicalCollectionPage({
  params,
}: EditPhysicalCollectionPageProps) {
  // Le proxy garantit que l'utilisateur est authentifié
  const userEmail = await getAuthenticatedUserEmail();

  // Récupérer l'utilisateur backoffice
  const backofficeUser = await getBackofficeUserByEmail(userEmail);

  // Vérifier que l'utilisateur a un profil artiste
  if (!backofficeUser || !backofficeUser.artistId) {
    redirect("/art/create-artist-profile");
  }

  // Récupérer l'ID de la collection depuis les params
  const { id } = await params;
  const collectionId = parseInt(id, 10);

  if (isNaN(collectionId)) {
    notFound();
  }

  // Récupérer la collection
  const collection = await getPhysicalCollectionById(collectionId);

  if (!collection) {
    notFound();
  }

  return (
    <FormPage>
      <FormPageHeader
        title="Modifier la collection"
        subtitle="Modifiez les informations de votre collection. Vous pourrez continuer à y associer vos œuvres physiques."
      />
      <FormCard>
        <EditPhysicalCollectionForm collection={collection} />
      </FormCard>
    </FormPage>
  );
}
