'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/app/components/Navbar/Navbar'
import SideMenu from '@/app/components/SideMenu/SideMenu'
import './users.css'
import { ShopifyUser } from '@prisma/client'

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
      <div className="page-layout">
        <SideMenu />
        <div className="content-container">
          <div className="shopify-users-container">
            <div className="shopify-users-header">
              <h1 className="page-title">Utilisateurs Shopify</h1>
              <p className="subtitle">
                Liste des utilisateurs Shopify enregistrés dans le système
              </p>
            </div>
            
            <div className="shopify-users-content">
              {users.length === 0 ? (
                <div className="empty-state">
                  <p>Aucun utilisateur Shopify trouvé</p>
                </div>
              ) : (
                <div className="table-container">
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>Nom</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th className="hidden-mobile">Wallet Address</th>
                        <th className="hidden-small">Date de création</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr 
                          key={user.id} 
                          onClick={() => handleUserClick(user.id.toString())}
                          className="clickable-row"
                        >
                          <td>{user.firstName} {user.lastName}</td>
                          <td>{user.email}</td>
                          <td>{user.role || 'Utilisateur'}</td>
                          <td className="hidden-mobile">{user.walletAddress}</td>
                          <td className="hidden-small">{formatDate(user.createdAt)}</td>
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