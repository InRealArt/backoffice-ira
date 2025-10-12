import { notFound } from 'next/navigation'
import { getStickyFooterById } from '@/lib/actions/sticky-footer-actions'
import StickyFooterEditForm from './StickyFooterEditForm'

export const metadata = {
  title: 'Modifier le Sticky Footer | Administration',
  description: 'Modifier les informations d\'un sticky footer existant'
}

export default async function EditStickyFooterPage({ params }: { params: Promise<{ id: string }> }) {
  const awaitedParams = await params
  
  if (!awaitedParams.id || isNaN(parseInt(awaitedParams.id))) {
    notFound()
  }
  
  const stickyFooterId = parseInt(awaitedParams.id)
  
  const stickyFooter = await getStickyFooterById(stickyFooterId)
  
  if (!stickyFooter) {
    notFound()
  }
  
  return <StickyFooterEditForm stickyFooter={stickyFooter} />
}
