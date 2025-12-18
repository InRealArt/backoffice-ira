import { getAuthenticatedUserEmail } from "@/lib/auth-helpers";
import { getBackofficeUserByEmail } from "@/lib/actions/prisma-actions";
import { redirect } from "next/navigation";
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
    <div className="page-content">
      <div className="card max-w-5xl mx-auto px-8">
        <div className="card-body">
          <h1 className="page-title text-3xl">Créer une collection</h1>
          <p className="text-muted mb-4">
            Créez une nouvelle collection pour organiser vos œuvres. Vous
            pourrez ensuite y associer vos œuvres physiques.
          </p>
          <CreatePhysicalCollectionForm />
        </div>
      </div>
    </div>
  );
}
