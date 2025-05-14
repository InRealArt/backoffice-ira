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
  onNameChange 
}: FormFields & { 
  title?: string, 
  onTitleChange?: (e: React.ChangeEvent<HTMLInputElement>) => void,
  onNameChange?: (e: React.ChangeEvent<HTMLInputElement>) => void 
}) {
  return (
    <FormSection title="Caractéristiques principales">
      <div className={styles.formGrid}>
        {/* Name */}
        <div className={styles.formGroup}>
          <label htmlFor="name" className={styles.formLabel} data-required={true}>
            Nom
          </label>
          <input
            id="name"
            type="text"
            {...register('name', { 
              required: true,
              onChange: onNameChange // Appeler le gestionnaire de changement de name
            })}
            className={`${styles.formInput} ${errors.name ? styles.formInputError : ''}`}
            placeholder="Entrez le nom de l'œuvre"
            defaultValue={title}
          />
          {errors.name && <p className={styles.formError}>Le nom est requis</p>}
        </div>
        
        {/* Slug généré automatiquement */}
        <div className={styles.formGroup}>
          <label htmlFor="slug" className={styles.formLabel}>
            Slug
            <InfoTooltip
              title="Slug"
              content="URL simplifiée générée automatiquement à partir du nom"
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
          <p className={styles.formHelp}>Ce champ est généré automatiquement à partir du nom</p>
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