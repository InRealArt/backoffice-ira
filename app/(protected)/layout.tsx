'use client'

import { useIsLoggedIn } from '@dynamic-labs/sdk-react-core'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Navbar from '@/app/components/Navbar/Navbar'
import SideMenu from '@/app/components/SideMenu/SideMenu'
import AuthObserver from '@/app/components/Auth/AuthObserver'

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
        <SideMenu />
        <div className="content-container">
          {children}
        </div>
      </div>
    </>
  )
} 