import { useRouter } from 'next/navigation'
import Button from '@/app/components/Button/Button'

interface FormActionsProps {
  isSubmitting: boolean
  isEditMode: boolean
}

function FormActions({ isSubmitting, isEditMode }: FormActionsProps) {
  const router = useRouter()
  
  return (
    <div className="flex justify-end gap-4 mt-8 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
      <Button 
        type="button" 
        variant="secondary"
        size="medium"
        onClick={() => router.push('/art/collection')}
        disabled={isSubmitting}
      >
        Annuler
      </Button>
      <Button 
        type="submit" 
        variant="primary"
        size="medium"
        disabled={isSubmitting}
        isLoading={isSubmitting}
        loadingText={isEditMode ? 'Modification en cours...' : 'Création en cours...'}
      >
        {isEditMode ? 'Mettre à jour l\'œuvre' : 'Créer l\'œuvre'}
      </Button>
    </div>
  )
}

export default FormActions 