import { getWhiteListedUsers } from '@/lib/actions/prisma-actions'
import type { SearchParams } from 'nuqs/server'
import { loadUsersSearchParams } from './searchParams'
import UsersClient from './UsersClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Utilisateurs Backoffice | Administration',
  description: 'Gérez les utilisateurs autorisés à accéder au backoffice',
}

type PageProps = {
  searchParams: Promise<SearchParams>
}

export default async function UsersPage({ searchParams }: PageProps) {
  const { sort, order } = await loadUsersSearchParams(searchParams)

  const VALID_SORT_FIELDS = ['email', 'role', 'artist'] as const
  type ValidSortField = typeof VALID_SORT_FIELDS[number]

  const isValidField = (VALID_SORT_FIELDS as readonly string[]).includes(sort)
  const field = isValidField ? (sort as ValidSortField) : 'id'
  const direction = order === 'desc' ? 'desc' : 'asc'

  const users = await getWhiteListedUsers({ field, direction })

  return (
    <UsersClient
      users={users}
      currentSort={isValidField ? sort : ''}
      currentOrder={direction}
    />
  )
}
