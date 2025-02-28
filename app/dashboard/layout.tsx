'use client'

import { useIsLoggedIn } from '@dynamic-labs/sdk-react-core'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const isLoggedIn = useIsLoggedIn()
  const router = useRouter()
  
  useEffect(() => {
    if (isLoggedIn === false) {
      router.push('/')
    }
  }, [isLoggedIn, router])
  
  return isLoggedIn === true ? children : null
} 