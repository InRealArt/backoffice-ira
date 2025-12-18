'use client'

import { useParams } from 'next/navigation'
import { useRouter, usePathname } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'

export default function LanguageSwitcher () {
  const params = useParams()
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = params.locale || routing.defaultLocale

  const handleLocaleChange = (newLocale: string) => {
    // Utiliser le router de next-intl pour changer la locale
    router.replace(pathname, { locale: newLocale })
  }

  return (
    <div className="flex items-center gap-2">
      {routing.locales.map((locale) => (
        <button
          key={locale}
          onClick={() => handleLocaleChange(locale)}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            currentLocale === locale
              ? 'bg-primary text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600'
          }`}
          aria-label={`Changer la langue en ${locale.toUpperCase()}`}
        >
          {locale.toUpperCase()}
        </button>
      ))}
    </div>
  )
}


