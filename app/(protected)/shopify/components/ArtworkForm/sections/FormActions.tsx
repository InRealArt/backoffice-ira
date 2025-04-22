import { useRouter } from 'next/navigation'
import styles from '../../ArtworkForm.module.scss'

interface FormActionsProps {
  isSubmitting: boolean
  isEditMode: boolean
}

function FormActions({ isSubmitting, isEditMode }: FormActionsProps) {
  const router = useRouter()
  
  return (
    <div className={styles.formActions}>
      <button 
        type="button" 
        className={styles.cancelButton}
        onClick={() => router.push('/shopify/collection')}
        disabled={isSubmitting}
      >
        Annuler
      </button>
      <button 
        type="submit" 
        className={styles.submitButton}
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