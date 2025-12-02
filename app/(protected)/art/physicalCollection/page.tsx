import { getAuthenticatedUserEmail } from "@/lib/auth-helpers";
import { getBackofficeUserByEmail } from "@/lib/actions/prisma-actions";
import { redirect } from "next/navigation";
import { getPhysicalCollectionsWithItems } from "@/lib/actions/physical-collection-actions";
import PhysicalCollectionsList from "./PhysicalCollectionsList";
import NavigationButton from "./NavigationButton";

export default async function PhysicalCollectionsPage() {
  // Le proxy garantit que l'utilisateur est authentifié
  const userEmail = await getAuthenticatedUserEmail();

  // Récupérer l'utilisateur backoffice
  const backofficeUser = await getBackofficeUserByEmail(userEmail);

  // Vérifier que l'utilisateur a un profil artiste
  if (!backofficeUser || !backofficeUser.artistId) {
    redirect("/art/create-artist-profile");
  }

  // Récupérer les collections avec leurs items
  const collections = await getPhysicalCollectionsWithItems();

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">Mes Collections Physiques</h1>
          <NavigationButton
            href="/art/create-physical-collection"
            variant="primary"
            className="px-6 py-2"
          >
            Créer une collection
          </NavigationButton>
        </div>
        <p className="page-subtitle">
          Gérez vos collections d'œuvres physiques
        </p>
      </div>

      <div className="page-content">
        {collections.length === 0 ? (
          <div className="empty-state">
            <p>Aucune collection physique trouvée</p>
            <NavigationButton
              href="/art/create-physical-collection"
              variant="primary"
              className="mt-4"
            >
              Créer votre première collection
            </NavigationButton>
          </div>
        ) : (
          <PhysicalCollectionsList collections={collections} />
        )}
      </div>
    </div>
  );
}
