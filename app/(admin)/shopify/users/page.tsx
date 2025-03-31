import { getBackofficeUsers } from '@/lib/actions/prisma-actions'
import BackofficeUsersClient from './ShopifyUsersClient'


export default async function BackofficeUsersPage() {
  const users = await getBackofficeUsers()

  return <BackofficeUsersClient users={users} />
} 