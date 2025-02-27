import { Suspense } from 'react'
import { getShopifyUserById } from '@/app/actions/prisma/prismaActions'
import EditUserForm from './EditUserForm'
import LoadingSpinner from '@/app/components/LoadingSpinner'
import Navbar from '@/app/components/Navbar/Navbar'
import SideMenu from '@/app/components/SideMenu/SideMenu'

interface EditUserPageProps {
  params: Promise<{ id: string }> | { id: string }
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  // Attendre les paramètres s'ils sont une promesse
  const resolvedParams = await Promise.resolve(params)
  const id = String(resolvedParams.id)
  
  const user = await getShopifyUserById(id)
  
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
} 