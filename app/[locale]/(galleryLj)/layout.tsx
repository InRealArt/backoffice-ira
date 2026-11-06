'use client'

import React, { useEffect } from 'react'
import { authClient } from '@/lib/auth-client'
import { useRouter, useParams } from 'next/navigation'
import { NextIntlClientProvider } from 'next-intl'
import Navbar from '@/app/components/Navbar/Navbar'
import LoadingSpinner from '@/app/components/LoadingSpinner/LoadingSpinner'
import { routing } from '@/i18n/routing'
import frMessages from '@/messages/fr.json'
import enMessages from '@/messages/en.json'
import { useSessionRole } from '@/app/hooks/useSessionRole'
import { BackofficeUserRoles } from '@/lib/types/roles'

const messages: Record<string, any> = {
  fr: frMessages,
  en: enMessages
}

export default function GalleryLjLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const params = useParams()
  const { data: session, isPending: isSessionPending } = authClient.useSession()
  const { role, isLoading: isRoleLoading } = useSessionRole()
  const isLoggedIn = !!session

  const locale = (params.locale as string) || routing.defaultLocale
  const localeMessages = messages[locale] || messages[routing.defaultLocale]

  useEffect(() => {
    if (!isSessionPending && !isLoggedIn) {
      router.push(`/${locale}/sign-in`)
      return
    }

    // Strict isolation: ONLY galleryLjManager is allowed here.
    // Admin must NOT inherit access to galleryLj routes.
    if (!isSessionPending && !isRoleLoading && isLoggedIn && role !== BackofficeUserRoles.galleryLjManager) {
      router.push(`/${locale}/dashboard`)
    }
  }, [isLoggedIn, isSessionPending, isRoleLoading, role, router, locale])

  const isAuthorized = role === BackofficeUserRoles.galleryLjManager

  if (isSessionPending || isRoleLoading) {
    return <LoadingSpinner message="Vérification des droits..." />
  }

  if (!isLoggedIn || !isAuthorized) {
    return null
  }

  return (
    <NextIntlClientProvider messages={localeMessages} locale={locale}>
      <Navbar />
      <div className="min-h-[calc(100vh-90px)] mt-[90px] bg-background-main transition-colors duration-300">
        <div className="w-full max-w-[1400px] mx-auto px-8 lg:px-16 xl:px-24 py-8 transition-all duration-300 overflow-x-hidden bg-background-main md:px-12 sm:px-6">
          {children}
        </div>
      </div>
    </NextIntlClientProvider>
  )
}
