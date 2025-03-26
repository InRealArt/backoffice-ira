import { getBackofficeUsers } from '@/app/actions/prisma/prismaActions'
import BackofficeUsersClient from './ShopifyUsersClient'


export default async function BackofficeUsersPage() {
  const users = await getBackofficeUsers()

  return <BackofficeUsersClient users={users} />
} 