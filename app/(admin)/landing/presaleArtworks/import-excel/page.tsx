import { getAllArtistsAndGalleries } from '@/lib/actions/prisma-actions'
import ImportExcelForm from './ImportExcelForm'

export const metadata = {
  title: 'Import Excel d\'œuvres en prévente | Administration',
  description: 'Importez plusieurs œuvres en prévente depuis un fichier Excel',
}

export default async function ImportExcelPage() {
  // Récupérer tous les artistes
  const artists = await getAllArtistsAndGalleries()

  return <ImportExcelForm artists={artists} />
}




