import { notFound } from 'next/navigation'
import { getFaqById } from '@/lib/actions/faq-actions'
import FaqForm from '../../components/FaqForm'

interface EditFaqPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: EditFaqPageProps) {
  return {
    title: 'Modifier une FAQ | Administration',
    description: 'Modifiez une question fréquemment posée',
  }
}

export default async function EditFaqPage({ params }: EditFaqPageProps) {
  const faqId = parseInt(params.id, 10)
  
  if (isNaN(faqId)) {
    notFound()
  }
  
  const faq = await getFaqById(faqId)
  
  if (!faq) {
    notFound()
  }
  
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Modifier une FAQ</h1>
        <p className="page-subtitle">
          Modifiez une question fréquemment posée
        </p>
      </div>
      
      <div className="page-content">
        <FaqForm mode="edit" faq={faq} />
      </div>
    </div>
  )
} 