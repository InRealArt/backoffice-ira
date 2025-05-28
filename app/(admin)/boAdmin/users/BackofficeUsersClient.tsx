'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BackofficeUser } from '@prisma/client'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import {
  PageContainer,
  PageHeader,
  PageContent,
  DataTable,
  EmptyState,
  ActionButton,
  Badge,
  Column
} from '../../../components/PageLayout/index'

interface BackofficeUsersClientProps {
  users: BackofficeUser[]
}

export default function BackofficeUsersClient({ users }: BackofficeUsersClientProps) {
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null)
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  
  // Force le rafraîchissement des données au montage du composant
  useEffect(() => {
    router.refresh()
  }, [router])
  
  // Détecte si l'écran est de taille mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    // Vérifier au chargement
    checkIfMobile()
    
    // Écouter les changements de taille d'écran
    window.addEventListener('resize', checkIfMobile)
    
    return () => {
      window.removeEventListener('resize', checkIfMobile)
    }
  }, [])
  
  const handleUserClick = (user: BackofficeUser) => {
    setLoadingUserId(user.id.toString())
    router.push(`/boAdmin/users/${user.id}/edit`)
  }
  
  const handleCreateUser = () => {
    setIsCreatingUser(true)
    router.push('/boAdmin/create-member')
  }

  // Fonction pour forcer un rechargement complet des données
  const handleRefresh = () => {
    setIsRefreshing(true)
    // Utiliser router.refresh pour recharger les données du serveur
    router.refresh()
    // Attendre un court délai pour éviter un rafraîchissement trop rapide de l'interface
    setTimeout(() => {
      // Pour être vraiment sûr, on peut forcer un rechargement complet de la page
      window.location.reload()
    }, 100)
  }
  
  // Fonction pour déterminer la variante du badge selon le rôle
  const getRoleBadgeVariant = (role: string | null): { variant: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info', text: string } => {
    if (!role) return { variant: 'secondary', text: 'Utilisateur' }
    
    const roleLC = role.toLowerCase()
    
    if (roleLC === 'admin' || roleLC === 'administrateur') {
      return { variant: 'danger', text: 'Admin' }
    } else if (roleLC === 'artist' || roleLC === 'artiste') {
      return { variant: 'success', text: 'Artiste' }
    } else if (roleLC === 'gallerymanager') {
      return { variant: 'info', text: 'Resp. galerie' }
    } else {
      return { variant: 'secondary', text: 'Utilisateur' }
    }
  }

  // Définition des colonnes pour le DataTable
  const columns: Column<BackofficeUser>[] = [
    {
      key: 'name',
      header: 'Nom',
      render: (user) => (
        <div className="d-flex align-items-center gap-sm">
          {loadingUserId === user.id.toString() && <LoadingSpinner size="small" message="" inline />}
          <span className={loadingUserId === user.id.toString() ? 'text-muted' : ''}>
            {user.firstName} {user.lastName}
          </span>
        </div>
      )
    },
    {
      key: 'email',
      header: 'Email'
    },
    {
      key: 'role',
      header: 'Rôle',
      width: '140px',
      render: (user) => {
        const { variant, text } = getRoleBadgeVariant(user.role)
        return <Badge variant={variant} text={text} />
      }
    },
    {
      key: 'walletAddress',
      header: 'Wallet Address',
      className: 'hidden-mobile'
    },
    {
      key: 'createdAt',
      header: 'Date de création',
      className: 'hidden-mobile',
      render: (user) => formatDate(user.createdAt)
    }
  ]
  
  return (
    <PageContainer>
      <PageHeader 
        title="Utilisateurs Back-office"
        subtitle={`Liste des utilisateurs enregistrés dans le Back-office (${users.length} utilisateur${users.length > 1 ? 's' : ''})`}
        actions={
          <div className="d-flex gap-sm">
            <ActionButton 
              label={isRefreshing ? 'Actualisation...' : 'Actualiser la liste'}
              onClick={handleRefresh}
              disabled={isRefreshing}
              variant="secondary"
              size="medium"
              isLoading={isRefreshing}
            />
            <ActionButton 
              label={isCreatingUser ? 'Création...' : 'Créer un utilisateur de backoffice'}
              onClick={handleCreateUser}
              disabled={isCreatingUser}
              size="medium"
              isLoading={isCreatingUser}
            />
          </div>
        }
      />
      
      <PageContent>
        <DataTable
          data={users}
          columns={columns}
          keyExtractor={(user) => user.id}
          onRowClick={handleUserClick}
          isLoading={false}
          loadingRowId={loadingUserId}
          emptyState={
            <EmptyState 
              message="Aucun utilisateur Shopify trouvé"
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

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
} 