import { useRouter } from 'next/navigation'

interface FormActionsProps {
  isSubmitting: boolean
  isEditMode: boolean
}

function FormActions({ isSubmitting, isEditMode }: FormActionsProps) {
  const router = useRouter()
  
  return (
    <div className="flex justify-end gap-4 mt-8 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
      <button 
        type="button" 
        className="px-6 py-3 text-base font-semibold rounded bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200 disabled:opacity-70 disabled:cursor-not-allowed"
        onClick={() => router.push('/art/collection')}
        disabled={isSubmitting}
      >
        Annuler
      </button>
      <button 
        type="submit" 
        className="px-6 py-3 text-base font-semibold rounded bg-[#4a6cf7] text-white hover:bg-[#3a57e8] disabled:opacity-70 disabled:cursor-not-allowed"
        disabled={isSubmitting}
      >
        {isSubmitting 
          ? (isEditMode ? 'Modification en cours...' : 'Création en cours...') 
          : (isEditMode ? 'Mettre à jour l\'œuvre' : 'Créer l\'œuvre')}
      </button>
    </div>
  )
}

export default FormActions 