import GalleryLjExhibitionForm from "../GalleryLjEventForm";

export const metadata = {
  title: "Nouvelle exposition Galerie LJ | Administration",
  description: "Ajoutez une nouvelle exposition à la galerie LJ",
};

export default function CreateGalleryLjExhibitionPage() {
  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Nouvelle exposition</h1>
        <p className="page-subtitle">Ajoutez une exposition à la galerie LJ</p>
      </div>
      <div className="page-content">
        <GalleryLjExhibitionForm mode="create" />
      </div>
    </div>
  );
}
