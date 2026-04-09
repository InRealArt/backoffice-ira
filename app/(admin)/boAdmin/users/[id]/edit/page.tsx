import { notFound } from 'next/navigation'
import { getWhiteListedUserById } from '@/lib/actions/prisma-actions'
import UserEditForm from './UserEditForm'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Modifier un utilisateur | Administration',
  description: 'Modifier les informations d\'un utilisateur backoffice',
}

interface EditUserPageProps {
  params: Promise<{ id: string }>
}

export default async function EditUserPage({ params }: EditUserPageProps) {
  const { id } = await params

  const userId = parseInt(id)
  if (isNaN(userId)) {
    notFound()
  }

  const user = await getWhiteListedUserById(id)

  if (!user) {
    notFound()
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">Modifier l&apos;utilisateur</h1>
        </div>
        <p className="page-subtitle">Modifiez les informations de l&apos;utilisateur backoffice</p>
      </div>
      <UserEditForm user={user} />
    </div>
  )
}
