import { getWhiteListedUsers } from '@/lib/actions/prisma-actions'
import UsersClient from './UsersClient'

export const metadata = {
  title: 'Utilisateurs Backoffice | Administration',
  description: 'Gérez les utilisateurs autorisés à accéder au backoffice',
}

export default async function UsersPage() {
  const users = await getWhiteListedUsers()

  return <UsersClient users={users} />
}
