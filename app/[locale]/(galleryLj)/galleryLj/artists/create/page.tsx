import GalleryLjArtistForm from '../GalleryLjArtistForm'

export const metadata = {
  title: 'Nouvel artiste Galerie LJ | Administration',
  description: 'Ajoutez un nouvel artiste à la galerie LJ',
}

export default function CreateGalleryLjArtistPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Nouvel artiste</h1>
        <p className="page-subtitle">
          Ajoutez un artiste exposé dans la galerie LJ
        </p>
      </div>
      <div className="page-content">
        <GalleryLjArtistForm mode="create" />
      </div>
    </div>
  )
}
