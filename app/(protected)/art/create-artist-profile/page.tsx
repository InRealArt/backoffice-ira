import { getAuthenticatedUserEmail } from "@/lib/auth-helpers";
import CreateArtistProfileForm from "./CreateArtistProfileForm";

export default async function CreateArtistProfilePage() {
  // Le proxy garantit que l'utilisateur est authentifié
  // On peut directement récupérer l'email sans vérification supplémentaire
  const userEmail = await getAuthenticatedUserEmail();

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Créer mon profil Artiste
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400">
            Complétez votre profil artiste. Les informations saisies seront
            utilisées pour créer votre profil sur la plateforme.
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 pt-6 sm:pt-8 md:pt-10 pr-6 sm:pr-8 md:pr-10 pb-6 sm:pb-8 md:pb-10 overflow-hidden">
        <CreateArtistProfileForm userEmail={userEmail} />
      </div>
    </div>
  );
}
