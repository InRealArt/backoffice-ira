import { getAuthenticatedUserEmail } from "@/lib/auth-helpers";
import { getBackofficeUserByEmail } from "@/lib/actions/prisma-actions";
import { redirect } from "next/navigation";
import { FormCard, FormPage, FormPageHeader } from "@/app/components/Forms/FormKit/FormKit";
import CreatePhysicalCollectionForm from "./CreatePhysicalCollectionForm";

export default async function CreatePhysicalCollectionPage() {
  // Le proxy garantit que l'utilisateur est authentifié
  const userEmail = await getAuthenticatedUserEmail();

  // Récupérer l'utilisateur backoffice
  const backofficeUser = await getBackofficeUserByEmail(userEmail);

  // Vérifier que l'utilisateur a un profil artiste
  if (!backofficeUser || !backofficeUser.artistId) {
    redirect("/art/create-artist-profile");
  }

  return (
    <FormPage>
      <FormPageHeader
        title="Créer une collection"
        subtitle="Créez une nouvelle collection pour organiser vos œuvres. Vous pourrez ensuite y associer vos œuvres physiques."
      />
      <FormCard>
        <CreatePhysicalCollectionForm />
      </FormCard>
    </FormPage>
  );
}
