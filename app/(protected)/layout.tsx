'use client'

import { useIsLoggedIn } from '@dynamic-labs/sdk-react-core'
import { useRouter } from 'next/navigation'
import { useEffect, Suspense } from 'react'
import Navbar from '@/app/components/Navbar/Navbar'
import SideMenu from '@/app/components/SideMenu/SideMenu'
import AuthObserver from '@/app/components/Auth/AuthObserver'

// Composant de fallback pour le Suspense du SideMenu
function SideMenuFallback() {
  return (
    <div className="side-menu side-menu-debug animate-side-menu">
      <button 
        className="side-menu-toggle" 
        disabled
        aria-label="Chargement du menu"
      >
        <span className="toggle-icon">→</span>
      </button>
      <ul className="menu-list">
        <li className="menu-item skeleton">
          <span className="menu-item-icon">📊</span>
          <span className="menu-item-label">Chargement...</span>
        </li>
      </ul>
    </div>
  )
}

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const isLoggedIn = useIsLoggedIn()
  const router = useRouter()
  
  useEffect(() => {
    if (isLoggedIn === false) {
      router.push('/')
    }
  }, [isLoggedIn, router])
  
  if (isLoggedIn === false) return null
  
  return (
    <>
      <AuthObserver />
      <Navbar />
      <div className="page-layout">
        <Suspense fallback={<SideMenuFallback />}>
          <SideMenu />
        </Suspense>
        <div className="content-container">
          {children}
        </div>
      </div>
    </>
  )
} 