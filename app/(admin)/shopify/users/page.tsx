import { getShopifyUsers } from '@/app/actions/prisma/prismaActions'
import ShopifyUsersClient from './ShopifyUsersClient'

export default async function ShopifyUsersPage() {
  const users = await getShopifyUsers()

  return <ShopifyUsersClient users={users} />
} 