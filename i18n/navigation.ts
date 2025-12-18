import { createNavigation } from 'next-intl/navigation'
import { routing } from './routing'

// Créer les APIs de navigation typées qui incluent automatiquement la locale
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing)


