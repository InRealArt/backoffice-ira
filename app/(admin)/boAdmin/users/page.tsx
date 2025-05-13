import { getBackofficeUsers } from '@/lib/actions/prisma-actions'
import BackofficeUsersClient from './ShopifyUsersClient'

// Désactive le cache pour cette route afin de toujours avoir les données à jour
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function BackofficeUsersPage() {
  
  const users = await getBackofficeUsers()

  return <BackofficeUsersClient users={users} />
} 