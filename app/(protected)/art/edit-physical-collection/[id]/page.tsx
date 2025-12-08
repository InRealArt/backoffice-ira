import { getAuthenticatedUserEmail } from "@/lib/auth-helpers";
import { getBackofficeUserByEmail } from "@/lib/actions/prisma-actions";
import { redirect, notFound } from "next/navigation";
import { getPhysicalCollectionById } from "@/lib/actions/physical-collection-actions";
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
    <div className="page-content">
      <div className="card max-w-5xl mx-auto px-8">
        <div className="card-body">
          <h1 className="page-title text-3xl">Modifier la collection</h1>
          <p className="text-muted mb-4">
            Modifiez les informations de votre collection. Vous pourrez
            continuer à y associer vos œuvres physiques.
          </p>
          <EditPhysicalCollectionForm collection={collection} />
        </div>
      </div>
    </div>
  );
}

