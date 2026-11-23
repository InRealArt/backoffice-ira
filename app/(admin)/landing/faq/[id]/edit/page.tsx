import { notFound } from 'next/navigation'
import { getFaqById } from '@/lib/actions/faq-actions'
import FaqForm from '../../components/FaqForm'

interface EditFaqPageProps {
  params: Promise<{
    id: string
  }>
}

export async function generateMetadata({ params }: EditFaqPageProps) {
  const resolvedParams = await params
  return {
    title: 'Modifier une FAQ | Administration',
    description: 'Modifiez une question fréquemment posée',
  }
}

export default async function EditFaqPage({ params }: EditFaqPageProps) {
  const resolvedParams = await params
  const faqId = parseInt(resolvedParams.id, 10)
  
  if (isNaN(faqId)) {
    notFound()
  }
  
  const faq = await getFaqById(faqId)
  
  if (!faq) {
    notFound()
  }
  
  return (
    <div className="page-container">
      <FaqForm mode="edit" faq={faq} />
    </div>
  )
} 