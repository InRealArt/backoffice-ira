import GalleryLjExhibitionForm from "../../../exhibitions/GalleryLjEventForm";
import { getGalleryLjExhibitionById } from "@/lib/actions/gallery-lj-exhibition-actions";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Modifier un évènement Galerie LJ | Administration",
  description: "Modification d'un évènement de la galerie LJ",
};

interface EditGalleryLjEventPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditGalleryLjEventPage({
  params,
}: EditGalleryLjEventPageProps) {
  const resolvedParams = await params;
  const exhibitionId = parseInt(resolvedParams.id, 10);

  if (isNaN(exhibitionId)) {
    notFound();
  }

  const exhibition = await getGalleryLjExhibitionById(exhibitionId);

  if (!exhibition) {
    notFound();
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">Modifier un évènement</h1>
        <p className="page-subtitle">
          Modification de l&apos;évènement : {exhibition.name}
        </p>
      </div>

      <div className="page-content">
        <GalleryLjExhibitionForm mode="edit" exhibitionId={exhibitionId} />
      </div>
    </div>
  );
}
