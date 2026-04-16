import GalleryLjExhibitionForm from '../../exhibitions/GalleryLjEventForm'

export const metadata = {
  title: 'Nouvel évènement Galerie LJ | Administration',
  description: 'Ajoutez un nouvel évènement à la galerie LJ',
}

export default function CreateGalleryLjEventPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Nouvel évènement</h1>
        <p className="page-subtitle">
          Ajoutez un évènement à la galerie LJ
        </p>
      </div>
      <div className="page-content">
        <GalleryLjExhibitionForm mode="create" />
      </div>
    </div>
  )
}
