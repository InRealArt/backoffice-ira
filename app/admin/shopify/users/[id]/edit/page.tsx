import { Suspense } from 'react'
import { getShopifyUserById } from '@/app/actions/prisma/prismaActions'
import EditUserForm from './EditUserForm'
import LoadingSpinner from '@/app/components/LoadingSpinner'
import Navbar from '@/app/components/Navbar/Navbar'
import SideMenu from '@/app/components/SideMenu/SideMenu'

// Approche simplifiée sans interfaces personnalisées
export default async function EditUserPage({ 
  params 
}: { 
  params: any  // Utilisation de any pour éviter les conflits de type
}) {
  // Extraction sécurisée de l'ID
  const userId = params?.id || '';
  
  if (!userId) {
    return <div>ID utilisateur non valide</div>;
  }
  
  try {
    const user = await getShopifyUserById(userId);
    
    if (!user) {
      return (
        <div className="app-container">
          <Navbar />
          <div className="content-container">
            <SideMenu />
            <main className="main-content">
              <div className="error-container">Utilisateur non trouvé</div>
            </main>
          </div>
        </div>
      )
    }

    return (
      <div className="app-container">
        <Navbar />
        <div className="content-container">
          <SideMenu />
          <main className="main-content" style={{ paddingTop: '80px' }}>
            <Suspense fallback={<LoadingSpinner />}>
              <div className="page-container">
                <EditUserForm user={user} />
              </div>
            </Suspense>
          </main>
        </div>
      </div>
    )
  } catch (error) {
    console.error("Erreur lors de la récupération de l'utilisateur:", error);
    return <div>Une erreur s'est produite</div>;
  }
} 