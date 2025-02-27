import { notFound } from 'next/navigation'
import { getShopifyUserById } from '@/app/actions/prisma/prismaActions'
import Navbar from '@/app/components/Navbar/Navbar'
import SideMenu from '@/app/components/SideMenu/SideMenu'
import EditUserForm from './EditUserForm'

interface EditUserPageProps {
  params: {
    id: string
  }
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const user = await getShopifyUserById(params.id)
  
  if (!user) {
    notFound()
  }
  
  return (
    <>
      <Navbar />
      <div className="page-layout">
        <SideMenu />
        <div className="content-container">
          <EditUserForm user={user} />
        </div>
      </div>
    </>
  )
} 