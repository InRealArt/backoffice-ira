'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar/Navbar'
import SideMenu from '@/app/components/SideMenu/SideMenu'
import { ShopifyUser } from '@prisma/client'
import styles from './ShopifyUsersClient.module.scss'

interface ShopifyUsersClientProps {
  users: ShopifyUser[]
}

export default function ShopifyUsersClient({ users }: ShopifyUsersClientProps) {
  const [isMobile, setIsMobile] = useState(false)
  const router = useRouter()
  
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
    router.push(`/shopify/users/${userId}/edit`)
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
                      {users.map((user) => (
                        <tr 
                          key={user.id} 
                          onClick={() => handleUserClick(user.id.toString())}
                          className={styles.clickableRow}
                        >
                          <td>{user.firstName} {user.lastName}</td>
                          <td>{user.email}</td>
                          <td>{user.role || 'Utilisateur'}</td>
                          <td className={styles.hiddenMobile}>{user.walletAddress}</td>
                          <td className={styles.hiddenSmall}>{formatDate(user.createdAt)}</td>
                        </tr>
                      ))}
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