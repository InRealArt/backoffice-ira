import GalleryLjArtworkForm from '../GalleryLjArtworkForm'

export const metadata = {
  title: 'Nouvelle œuvre Galerie LJ | Administration',
  description: 'Ajoutez une nouvelle œuvre à la galerie LJ',
}

export default function CreateGalleryLjArtworkPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Nouvelle œuvre</h1>
        <p className="page-subtitle">
          Ajoutez une œuvre exposée dans la galerie LJ
        </p>
      </div>
      <div className="page-content">
        <GalleryLjArtworkForm mode="create" />
      </div>
    </div>
  )
}
