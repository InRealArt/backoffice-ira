import { getAllItemsForAdmin } from '@/lib/actions/prisma-actions'
import CollectionAdminClient, { type ItemWithRelations } from './CollectionAdminClient'

export default async function CollectionAdminPage() {
  // Récupérer tous les items avec leurs relations
  const items = await getAllItemsForAdmin() as unknown as ItemWithRelations[]

  return (
    <CollectionAdminClient items={items} />
  )
} 


