import { FormSectionProps } from './types'
import styles from '../ArtworkForm.module.scss'

function FormSection({ title, children }: FormSectionProps) {
  return (
    <>
      <div className={styles.formSectionTitle}>{title}</div>
      <div className={styles.formSectionContent}>
        {children}
      </div>
    </>
  )
}

export default FormSection 