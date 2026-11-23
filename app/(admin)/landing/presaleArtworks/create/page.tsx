import PresaleArtworkForm from '../PresaleArtworkForm'

export const metadata = {
  title: 'Nouvelle œuvre en prévente | Administration',
  description: 'Ajoutez une nouvelle œuvre en prévente',
}

export default function NewPresaleArtworkPage() {
  return (
    <div className="page-container max-w-5xl mx-auto">
      <div className="page-header">
        <h1 className="page-title">Nouvelle œuvre en prévente</h1>
        <p className="page-subtitle">
          Ajoutez une nouvelle œuvre pour la prévente
        </p>
      </div>
      
      <div className="page-content">
        <PresaleArtworkForm mode="create" />
      </div>
    </div>
  )
} 