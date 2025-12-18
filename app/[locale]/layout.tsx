import { NextIntlClientProvider } from 'next-intl'
import { getMessages, getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { ReactNode } from 'react'

type Props = {
  children: ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams () {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata ({ params }: Props) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'common' })

  return {
    title: t('welcome')
  }
}

export default async function LocaleLayout ({ children, params }: Props) {
  const { locale } = await params

  // S'assurer que la locale entrante est valide
  if (!routing.locales.includes(locale as any)) {
    notFound()
  }

  // Activer le rendu statique
  setRequestLocale(locale)

  // Récupérer tous les messages pour la locale
  const messages = await getMessages()

  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}


