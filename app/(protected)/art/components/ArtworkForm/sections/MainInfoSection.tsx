import { FormFields } from '../types'
import InfoTooltip from '../InfoTooltip'
import FormSection from '../FormSection'
import styles from '../../ArtworkForm.module.scss'

function MainInfoSection({ 
  register, 
  errors, 
  setValue, 
  slug = '', 
  title = '', 
  onTitleChange 
}: FormFields & { 
  title?: string, 
  onTitleChange?: (e: React.ChangeEvent<HTMLInputElement>) => void 
}) {
  return (
    <FormSection title="Caractéristiques principales">
      <div className={styles.formGrid}>
        {/* Title */}
        <div className={styles.formGroup}>
          <label htmlFor="title" className={styles.formLabel} data-required={true}>
            Titre
          </label>
          <input
            id="title"
            type="text"
            {...register('title', { 
              required: true,
              onChange: onTitleChange // Appeler le gestionnaire de changement de titre
            })}
            className={`${styles.formInput} ${errors.title ? styles.formInputError : ''}`}
            placeholder="Entrez le titre de l'œuvre"
            defaultValue={title}
          />
          {errors.title && <p className={styles.formError}>Le titre est requis</p>}
        </div>
        
        {/* Slug généré automatiquement */}
        <div className={styles.formGroup}>
          <label htmlFor="slug" className={styles.formLabel}>
            Slug
            <InfoTooltip
              title="Slug"
              content="URL simplifiée générée automatiquement à partir du titre"
            />
          </label>
          <input
            id="slug"
            type="text"
            value={slug}
            readOnly
            className={`${styles.formInput} ${styles.formInputDisabled}`}
            style={{ backgroundColor: '#f0f0f0', color: '#666', cursor: 'not-allowed' }}
          />
          <p className={styles.formHelp}>Ce champ est généré automatiquement à partir du titre</p>
        </div>
      </div>

      {/* Description */}
      <div className={styles.formGroup}>
        <label htmlFor="description" className={styles.formLabel}>
          Description
        </label>
        <textarea
          id="description"
          {...register('description')}
          className={`${styles.formTextarea} ${errors.description ? styles.formInputError : ''}`}
          rows={4}
          placeholder="Décrivez l'œuvre..."
        />
      </div>
    </FormSection>
  )
}

export default MainInfoSection 