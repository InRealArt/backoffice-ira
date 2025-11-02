'use client'

import { authClient } from '@/lib/auth-client'
import { useState, useEffect } from 'react'
import { getUserRole } from '@/lib/actions/auth-actions'
import { Badge } from '@/app/components/PageLayout'

export default function UserProfile() {
  const { data: session, isPending } = authClient.useSession()
  const user = session?.user
  const isLoggedIn = !!session
  const [userRole, setUserRole] = useState<string | null | undefined>(null)

  const handleSignOut = async () => {
    await authClient.signOut()
  }

  // Récupérer le rôle de l'utilisateur depuis la table BackofficeAuthUser
  useEffect(() => {
    const fetchUserRole = async () => {
      if (user?.email && !isPending) {
        try {
          const role = await getUserRole(user.email)
          setUserRole(role)
        } catch (error) {
          console.error('Erreur lors de la récupération du rôle:', error)
          setUserRole(null)
        }
      } else if (!isLoggedIn) {
        setUserRole(null)
      }
    }

    fetchUserRole()
  }, [user?.email, isLoggedIn, isPending])

  // Fonction pour déterminer le variant du badge selon le rôle
  const getRoleBadgeVariant = (role: string | null | undefined): 'success' | 'info' | 'secondary' => {
    if (!role) return 'secondary'
    
    const roleLC = role.toLowerCase()
    
    switch (roleLC) {
      case 'admin':
      case 'administrateur':
        return 'success'
      case 'artist':
      case 'artiste':
        return 'info'
      case 'gallerymanager':
      case 'gallery manager':
        return 'info'
      default:
        return 'secondary'
    }
  }

  // Fonction pour obtenir le texte du rôle en français
  const getRoleText = (role: string | null | undefined): string => {
    if (!role) return 'User'
    
    const roleLC = role.toLowerCase()
    
    switch (roleLC) {
      case 'admin':
      case 'administrateur':
        return 'Admin'
      case 'artist':
      case 'artiste':
        return 'Artiste'
      case 'gallerymanager':
      case 'gallery manager':
        return 'Resp. galerie'
      default:
        return 'User'
    }
  }

  if (!isLoggedIn || !user || isPending) {
    return null
  }

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
        <div className="w-10 rounded-full bg-neutral text-neutral-content flex items-center justify-center">
          <span className="text-sm">{user?.email?.charAt(0).toUpperCase()}</span>
        </div>
      </div>
      <ul
        tabIndex={0}
        className="menu menu-sm dropdown-content bg-base-100/95 backdrop-blur-md rounded-box z-[1] mt-3 w-52 p-2 shadow-2xl border-2 border-base-300"
        style={{backgroundColor: 'rgb(255 255 255 / 0.98)', backdropFilter: 'blur(12px) saturate(180%)', WebkitBackdropFilter: 'blur(12px) saturate(180%)'}}
      >
        <li>
          <a className="justify-between font-semibold">
            Profil
            <Badge 
              variant={getRoleBadgeVariant(userRole)} 
              text={getRoleText(userRole)}
              size="small"
            />
          </a>
        </li>
        <li className="divider my-0"></li>
        <li><a className="text-sm text-base-content/70">{user?.email}</a></li>
        <li className="divider my-0"></li>
        <li>
          <a onClick={handleSignOut} className="text-error hover:bg-error/10">
            🚪 Déconnexion
          </a>
        </li>
      </ul>
    </div>
  )
}
