import FaqForm from '../components/FaqForm'

export const metadata = {
  title: 'Nouvelle question FAQ | Administration',
  description: 'Ajoutez une nouvelle question à la FAQ',
}

export default function NewFaqPage() {
  return (
    <div className="page-container">
      <FaqForm mode="create" />
    </div>
  )
} 