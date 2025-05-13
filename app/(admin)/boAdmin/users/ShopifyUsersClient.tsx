'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { BackofficeUser } from '@prisma/client'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'

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
  
  const handleUserClick = (userId: string) => {
    setLoadingUserId(userId)
    router.push(`/boAdmin/users/${userId}/edit`)
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
  
  // Fonction pour déterminer la classe et le texte du badge selon le rôle
  const getRoleBadge = (role: string | null) => {
    if (!role) return null
    
    const roleLC = role.toLowerCase()
    
    if (roleLC === 'admin' || roleLC === 'administrateur') {
      return <span className="status-badge role-badge admin-badge">Admin</span>
    } else if (roleLC === 'artist' || roleLC === 'artiste') {
      return <span className="status-badge role-badge artist-badge">Artiste</span>
    } else if (roleLC === 'gallerymanager') {
      return <span className="status-badge role-badge gallery-badge">Resp. galerie</span>
    } else {
      return <span className="status-badge role-badge user-badge">Utilisateur</span>
    }
  }
  
  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">Utilisateurs Shopify</h1>
          <div className="button-group">
            <button 
              className="btn btn-secondary btn-medium"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <>
                  <LoadingSpinner size="small" message="" inline />
                  <span>Actualisation...</span>
                </>
              ) : (
                'Actualiser la liste'
              )}
            </button>
            <button 
              className="btn btn-primary btn-medium"
              onClick={handleCreateUser}
              disabled={isCreatingUser}
            >
              {isCreatingUser ? (
                <>
                  <LoadingSpinner size="small" message="" inline />
                  <span>Création...</span>
                </>
              ) : (
                'Créer un utilisateur de backoffice'
              )}
            </button>
          </div>
        </div>
        <p className="page-subtitle">
          Liste des utilisateurs Shopify enregistrés dans le système ({users.length} utilisateur{users.length > 1 ? 's' : ''})
        </p>
      </div>
      
      <div className="page-content">
        {users.length === 0 ? (
          <div className="empty-state">
            <p>Aucun utilisateur Shopify trouvé</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th className="hidden-mobile">Wallet Address</th>
                  <th className="hidden-mobile">Date de création</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const isLoading = loadingUserId === user.id.toString()
                  return (
                    <tr 
                      key={user.id} 
                      onClick={() => !loadingUserId && handleUserClick(user.id.toString())}
                      className={`clickable-row ${isLoading ? 'loading-row' : ''} ${loadingUserId && !isLoading ? 'disabled-row' : ''}`}
                    >
                      <td>
                        <div className="d-flex align-items-center gap-sm">
                          {isLoading && <LoadingSpinner size="small" message="" inline />}
                          <span className={isLoading ? 'text-muted' : ''}>
                            {user.firstName} {user.lastName}
                          </span>
                        </div>
                      </td>
                      <td>{user.email}</td>
                      <td>
                        <div className="status-badge-container">
                          {getRoleBadge(user.role)}
                        </div>
                      </td>
                      <td className="hidden-mobile">{user.walletAddress}</td>
                      <td className="hidden-mobile">{formatDate(user.createdAt)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
} 