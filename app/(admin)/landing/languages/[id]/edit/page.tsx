import { getLanguageById } from '@/lib/actions/language-actions'
import LanguageEditForm from './LanguageEditForm'

export default async function EditLanguagePage({ params }: { params: { id: string } }) {
  // Récupérer l'ID du paramètre d'URL et le convertir en nombre
  const languageId = parseInt(params.id, 10)

  // Gérer le cas où l'ID n'est pas un nombre valide
  if (isNaN(languageId)) {
    return <div>ID de langue invalide</div>
  }

  // Récupérer les données de la langue
  const language = await getLanguageById(languageId)

  if (!language) {
    return <div>Langue non trouvée</div>
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <LanguageEditForm language={language} />
    </div>
  )
} 