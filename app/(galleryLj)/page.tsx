import { redirect } from 'next/navigation'

/**
 * Root page for the galleryLj route group.
 * Redirects directly to the artists list — the only section for this role.
 */
export default function GalleryLjRootPage() {
  redirect('/fr/galleryLj/artists')
}
