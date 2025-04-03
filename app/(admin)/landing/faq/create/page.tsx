import FaqForm from '../components/FaqForm'

export const metadata = {
  title: 'Nouvelle question FAQ | Administration',
  description: 'Ajoutez une nouvelle question à la FAQ',
}

export default function NewFaqPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Nouvelle question FAQ</h1>
        <p className="page-subtitle">
          Ajoutez une nouvelle entrée dans la FAQ
        </p>
      </div>
      
      <div className="page-content">
        <FaqForm mode="create" />
      </div>
    </div>
  )
} 