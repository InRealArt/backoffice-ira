import { FormSectionProps } from './types'
import styles from '../ArtworkForm.module.scss'

function FormSection({ title, children }: FormSectionProps) {
  return (
    <div className={styles.formSectionContainer}>
      <div className={styles.formSectionTitle}>{title}</div>
      <div className={styles.formSectionContent}>
        {children}
      </div>
    </div>
  )
}

export default FormSection 