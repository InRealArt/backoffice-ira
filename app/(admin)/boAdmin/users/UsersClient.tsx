'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import type { WhiteListedUser, Artist } from '@/src/generated/prisma/browser'
import {
  PageContainer,
  PageHeader,
  PageContent,
  DataTable,
  EmptyState,
  ActionButton,
  DeleteActionButton,
  Badge,
  Column,
} from '../../../components/PageLayout/index'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import SortableHeader from './SortableHeader'
import { deleteWhiteListedUser } from '@/lib/actions/prisma-actions'

type UserWithArtist = WhiteListedUser & { artist: Artist | null }

interface UsersClientProps {
  users: UserWithArtist[]
  currentSort: string
  currentOrder: string
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'Administrateur',
  artist: 'Artiste',
  galleryManager: 'Responsable de galerie',
}

const ROLE_VARIANTS: Record<string, 'info' | 'success' | 'warning' | 'danger'> = {
  admin: 'danger',
  artist: 'success',
  galleryManager: 'info',
}

export default function UsersClient({ users, currentSort, currentOrder }: UsersClientProps) {
  const router = useRouter()
  const [loadingUserId, setLoadingUserId] = useState<number | null>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [localUsers, setLocalUsers] = useState<UserWithArtist[]>(users)

  // Sync local state when server-provided users change
  useEffect(() => {
    setLocalUsers(users)
  }, [users])

  useEffect(() => {
    const checkIfMobile = () => setIsMobile(window.innerWidth < 768)
    checkIfMobile()
    window.addEventListener('resize', checkIfMobile)
    return () => window.removeEventListener('resize', checkIfMobile)
  }, [])

  const handleUserClick = (user: UserWithArtist) => {
    setLoadingUserId(user.id)
    router.push(`/boAdmin/users/${user.id}/edit`)
  }

  const handleCreateUser = () => {
    router.push('/boAdmin/create-member')
  }

  const handleDeleteUser = async (user: UserWithArtist) => {
    const result = await deleteWhiteListedUser(user.id)
    if (result.success) {
      // Optimistic local removal while revalidation propagates
      setLocalUsers((prev) => prev.filter((u) => u.id !== user.id))
    }
  }

  const columns: Column<UserWithArtist>[] = [
    {
      key: 'email',
      header: (
        <Suspense fallback={<span>Email</span>}>
          <SortableHeader
            label="Email"
            columnKey="email"
            currentSort={currentSort}
            currentOrder={currentOrder}
          />
        </Suspense>
      ),
      render: (user) => (
        <div className="d-flex align-items-center gap-sm">
          {loadingUserId === user.id && <LoadingSpinner size="small" message="" inline />}
          <span className={loadingUserId === user.id ? 'text-muted' : ''}>
            {user.email}
          </span>
        </div>
      ),
    },
    {
      key: 'role',
      header: (
        <Suspense fallback={<span>Rôle</span>}>
          <SortableHeader
            label="Rôle"
            columnKey="role"
            currentSort={currentSort}
            currentOrder={currentOrder}
          />
        </Suspense>
      ),
      width: '180px',
      render: (user) =>
        user.role ? (
          <Badge
            variant={ROLE_VARIANTS[user.role] ?? 'info'}
            text={ROLE_LABELS[user.role] ?? user.role}
          />
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      key: 'artist',
      header: (
        <Suspense fallback={<span>Artiste / Galerie associé(e)</span>}>
          <SortableHeader
            label="Artiste / Galerie associé(e)"
            columnKey="artist"
            currentSort={currentSort}
            currentOrder={currentOrder}
          />
        </Suspense>
      ),
      render: (user) => {
        if (!user.artist) return <span className="text-muted">—</span>
        const label = user.artist.pseudo
          ? user.artist.pseudo
          : [user.artist.name, user.artist.surname].filter(Boolean).join(' ') || 'Sans nom'
        return <span>{label}</span>
      },
    },
    {
      key: 'actions',
      header: <span>Actions</span>,
      width: '120px',
      render: (user) => (
        <DeleteActionButton
          onDelete={() => handleDeleteUser(user)}
          itemName={user.email}
          buttonSize="small"
        />
      ),
    },
  ]

  return (
    <PageContainer>
      <PageHeader
        title="Utilisateurs Backoffice"
        subtitle="Liste des utilisateurs autorisés à accéder au backoffice"
        actions={
          <ActionButton
            label="+ Créer un utilisateur"
            onClick={handleCreateUser}
            size="medium"
          />
        }
      />

      <PageContent>
        <DataTable
          data={localUsers}
          columns={columns}
          keyExtractor={(user) => user.id}
          onRowClick={handleUserClick}
          isLoading={false}
          loadingRowId={loadingUserId}
          emptyState={
            <EmptyState
              message="Aucun utilisateur trouvé"
              action={
                <ActionButton
                  label="Créer un utilisateur"
                  onClick={handleCreateUser}
                  variant="primary"
                />
              }
            />
          }
        />
      </PageContent>
    </PageContainer>
  )
}
