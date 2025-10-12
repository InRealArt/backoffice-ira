import { getAllStickyFooters } from '@/lib/actions/sticky-footer-actions'
import StickyFooterClient from './StickyFooterClient'

export const metadata = {
  title: 'Paramétrage Sticky Footer | Administration',
  description: 'Gérez les paramètres du sticky footer',
}

export default async function StickyFooterPage() {
  const stickyFootersResponse = await getAllStickyFooters()
  
  return <StickyFooterClient stickyFooters={stickyFootersResponse.stickyFooters} />
}
