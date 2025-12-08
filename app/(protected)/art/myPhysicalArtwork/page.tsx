import { getAuthenticatedUserEmail } from "@/lib/auth-helpers";
import { getBackofficeUserByEmail } from "@/lib/actions/prisma-actions";
import { fetchItemsData } from "@/app/utils/items/itemsData";
import { getPhysicalCollectionsByArtistId } from "@/lib/actions/physical-collection-actions";
import MyPhysicalArtworkClient from "./MyPhysicalArtworkClient";

export default async function MyPhysicalArtworkPage() {
  // Récupérer l'email de l'utilisateur authentifié
  const userEmail = await getAuthenticatedUserEmail();

  // Récupérer l'utilisateur backoffice
  const userDB = await getBackofficeUserByEmail(userEmail);

  if (!userDB) {
    return (
      <div className="page-container">
        <div className="alert alert-error">
          Votre profil utilisateur n'a pas été trouvé
        </div>
      </div>
    );
  }

  // Récupérer les données des items
  const result = await fetchItemsData(userEmail);

  if (!result.success) {
    return (
      <div className="page-container">
        <div className="alert alert-error">
          {result.error || "Erreur lors du chargement de vos œuvres"}
        </div>
      </div>
    );
  }

  // Filtrer uniquement les items qui ont un physicalItem
  const physicalItems = (result.data || []).filter(
    (item) => item.physicalItem !== null && item.physicalItem !== undefined
  );

  // Récupérer les collections de l'artiste si l'utilisateur a un artistId
  let allCollections: Array<{
    id: number;
    name: string;
    description: string;
    landingArtistId: number;
  }> = [];

  if (userDB.artistId) {
    allCollections = await getPhysicalCollectionsByArtistId(userDB.artistId);
  }

  return (
    <MyPhysicalArtworkClient
      itemsData={physicalItems}
      userDB={{
        id: userDB.id,
        name: userDB.name,
        email: userDB.email,
        artistId: userDB.artistId,
      }}
      allCollections={allCollections}
    />
  );
}
