import { redirect } from 'next/navigation'

type Props = {
  params: Promise<{ locale: string }>
}

/**
 * Root page for the galleryLj route group.
 * Redirects directly to the artists list — the only section for this role.
 */
export default async function GalleryLjRootPage({ params }: Props) {
  const { locale } = await params
  redirect(`/${locale}/galleryLj/artists`)
}
