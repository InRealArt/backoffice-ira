import { Suspense } from "react";
import { getAllArtworkMediums } from "@/lib/actions/artwork-medium-actions";
import { getAllArtworkStyles } from "@/lib/actions/artwork-style-actions";
import { getAllArtworkTechniques } from "@/lib/actions/artwork-technique-actions";
import { getAllArtworkThemes } from "@/lib/actions/artwork-theme-actions";
import CreatePhysicalArtworkClient from "./CreatePhysicalArtworkClient";

export default async function CreatePhysicalArtworkPage() {
  // Récupérer les données de référence en parallèle
  const [mediums, styles, techniques, themes] = await Promise.all([
    getAllArtworkMediums(),
    getAllArtworkStyles(),
    getAllArtworkTechniques(),
    getAllArtworkThemes(),
  ]);

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          Chargement...
        </div>
      }
    >
      <CreatePhysicalArtworkClient
        mediums={mediums}
        styles={styles}
        techniques={techniques}
        themes={themes}
      />
    </Suspense>
  );
}
