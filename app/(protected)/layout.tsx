'use client'

import { useIsLoggedIn } from '@dynamic-labs/sdk-react-core'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Navbar from '@/app/components/Navbar/Navbar'
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
      <div className="min-h-[calc(100vh-90px)] mt-[90px] bg-background-main transition-colors duration-300">
        <div className="w-full p-xxl transition-all duration-300 overflow-x-hidden bg-background-main md:p-xl xs:p-lg">
          {children}
        </div>
      </div>
    </>
  )
} 