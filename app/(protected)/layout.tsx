'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef } from 'react'
import { authClient } from '@/lib/auth-client'
import Navbar from '@/app/components/Navbar/Navbar'
import AuthObserver from '@/app/components/Auth/AuthObserver'

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  const { data: session, isPending } = authClient.useSession()
  const router = useRouter()
  const hasRedirected = useRef(false)
  
  useEffect(() => {
    if (!isPending && !session && !hasRedirected.current) {
      hasRedirected.current = true
      router.push('/')
    }
  }, [session, isPending, router])
  
  if (isPending) return null
  if (!session) return null
  
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