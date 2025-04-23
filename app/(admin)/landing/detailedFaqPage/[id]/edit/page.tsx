import { notFound } from 'next/navigation'
import { getDetailedFaqPageById } from '@/lib/actions/faq-page-actions'
import DetailedFaqPageEditForm from './DetailedFaqPageEditForm'
import { DetailedFaqPage, DetailedFaqPageItem } from '@prisma/client'

interface DetailedFaqPageWithItems extends DetailedFaqPage {
  faqItems: DetailedFaqPageItem[]
}

export const metadata = {
  title: 'Éditer une FAQ de page | Administration',
  description: 'Modifiez les informations d\'une FAQ spécifique à une page',
}

export default async function EditDetailedFaqPagePage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const { id } = await params
  const idNumber = parseInt(id)
  
  if (isNaN(idNumber)) {
    return notFound()
  }
  
  const faqPage = await getDetailedFaqPageById(idNumber)
  
  if (!faqPage) {
    return notFound()
  }

  return <DetailedFaqPageEditForm faqPage={faqPage as DetailedFaqPageWithItems} />
} 