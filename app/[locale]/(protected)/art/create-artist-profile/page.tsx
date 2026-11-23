import { getAuthenticatedUserEmail } from "@/lib/auth-helpers";
import CreateArtistProfileForm from "./CreateArtistProfileForm";
import { FormCard, FormPage, FormPageHeader } from "@/app/components/Forms/FormKit/FormKit";

export default async function CreateArtistProfilePage() {
  // Le proxy garantit que l'utilisateur est authentifié
  // On peut directement récupérer l'email sans vérification supplémentaire
  const userEmail = await getAuthenticatedUserEmail();

  return (
    <FormPage>
      <FormPageHeader
        title="Créer mon profil Artiste"
        subtitle="Complétez votre profil artiste. Les informations saisies seront utilisées pour créer votre profil sur la plateforme."
      />
      <FormCard>
        <CreateArtistProfileForm userEmail={userEmail} />
      </FormCard>
    </FormPage>
  );
}
