'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar/Navbar'
import SideMenu from '@/app/components/SideMenu/SideMenu'
import { ShopifyUser } from '@prisma/client'
import styles from './ShopifyUsersClient.module.scss'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'

interface ShopifyUsersClientProps {
  users: ShopifyUser[]
}

export default function ShopifyUsersClient({ users }: ShopifyUsersClientProps) {
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null)
  
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
    router.push(`/admin/shopify/users/${userId}/edit`)
  }
  
  // Fonction pour déterminer la classe et le texte du badge selon le rôle
  const getRoleBadge = (role: string | null) => {
    if (!role) return null
    
    const roleLC = role.toLowerCase()
    
    if (roleLC === 'admin' || roleLC === 'administrateur') {
      return <span className={`${styles.roleBadge} ${styles.adminBadge}`}>Admin</span>
    } else if (roleLC === 'artist' || roleLC === 'artiste') {
      return <span className={`${styles.roleBadge} ${styles.artistBadge}`}>Artiste</span>
    } else if (roleLC === 'gallerymanager') {
      return <span className={`${styles.roleBadge} ${styles.galleryBadge}`}>Resp. galerie</span>
    } else {
      return <span className={`${styles.roleBadge} ${styles.userBadge}`}>Utilisateur</span>
    }
  }
  
  return (
    <>
      <Navbar />
      <div className={styles.pageLayout}>
        <SideMenu />
        <div className={styles.contentContainer}>
          <div className={styles.shopifyUsersContainer}>
            <div className={styles.shopifyUsersHeader}>
              <h1 className={styles.pageTitle}>Utilisateurs Shopify</h1>
              <p className={styles.subtitle}>
                Liste des utilisateurs Shopify enregistrés dans le système
              </p>
            </div>
            
            <div className={styles.shopifyUsersContent}>
              {users.length === 0 ? (
                <div className={styles.emptyState}>
                  <p>Aucun utilisateur Shopify trouvé</p>
                </div>
              ) : (
                <div className={styles.tableContainer}>
                  <table className={styles.usersTable}>
                    <thead>
                      <tr>
                        <th>Nom</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th className={styles.hiddenMobile}>Wallet Address</th>
                        <th className={styles.hiddenSmall}>Date de création</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => {
                        const isLoading = loadingUserId === user.id.toString()
                        return (
                          <tr 
                            key={user.id} 
                            onClick={() => !loadingUserId && handleUserClick(user.id.toString())}
                            className={`${styles.clickableRow} ${isLoading ? styles.loadingRow : ''} ${loadingUserId && !isLoading ? styles.disabledRow : ''}`}
                          >
                            <td>
                              <div className={styles.nameCell}>
                                {isLoading && <LoadingSpinner size="small" message="" inline />}
                                <span className={isLoading ? styles.loadingText : ''}>
                                  {user.firstName} {user.lastName}
                                </span>
                              </div>
                            </td>
                            <td>{user.email}</td>
                            <td>
                              <div className={styles.roleCell}>
                                {getRoleBadge(user.role)}
                              </div>
                            </td>
                            <td className={styles.hiddenMobile}>{user.walletAddress}</td>
                            <td className={styles.hiddenSmall}>{formatDate(user.createdAt)}</td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
} 