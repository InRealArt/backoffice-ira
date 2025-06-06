import { getAllItemsForAdmin } from '@/lib/actions/prisma-actions'
import CollectionAdminClient from './CollectionAdminClient'

export default async function CollectionAdminPage() {
  // Récupérer tous les items avec leurs relations
  const items = await getAllItemsForAdmin()

  return (
    <CollectionAdminClient items={items} />
  )
} 