import { FormFields } from '../types'
import InfoTooltip from '../InfoTooltip'
import FormSection from '../FormSection'
import styles from '../../ArtworkForm.module.scss'

function SeoSection({ register, errors }: FormFields) {
  return (
    <FormSection title="Informations SEO">
      <div className={styles.formGrid}>
        {/* Meta Title */}
        <div className={styles.formGroup}>
          <label htmlFor="metaTitle" className={styles.formLabel} data-required={true}>
            Titre SEO
            <InfoTooltip
              title="Titre SEO"
              content={
                <div>
                  <p>Ce titre sera utilisé dans les balises meta pour améliorer le référencement. Idéalement entre 50 et 60 caractères.</p>
                  <p className={styles.tooltipExample}><strong>Exemple :</strong> "Nuit Étoilée - Peinture à l'huile par Jean Dupont | IN REAL ART"</p>
                  <p className={styles.tooltipTips}>Conseil : Incluez le nom de l'œuvre, la technique et l'artiste.</p>
                </div>
              }
            />
          </label>
          <input
            id="metaTitle"
            type="text"
            {...register("metaTitle", { required: true })}
            className={`${styles.formInput} ${errors.metaTitle ? styles.formInputError : ''}`}
            placeholder="Titre optimisé pour les moteurs de recherche"
            maxLength={60}
          />
          {errors.metaTitle && <p className={styles.formError}>Le titre SEO est requis</p>}
        </div>
      </div>
      
      {/* Meta Description */}
      <div className={styles.formGroup}>
        <label htmlFor="metaDescription" className={styles.formLabel} data-required={true}>
          Description SEO
          <InfoTooltip
            title="Description SEO"
            content={
              <div>
                <p>Cette description sera utilisée dans les balises meta pour améliorer le référencement. Idéalement entre 120 et 160 caractères.</p>
                <p className={styles.tooltipExample}><strong>Exemple :</strong> "Découvrez 'Nuit Étoilée', une œuvre originale à l'huile sur toile par Jean Dupont. Créée en 2023, cette peinture expressionniste représente un paysage nocturne avec une technique unique de couches texturées."</p>
                <p className={styles.tooltipTips}>Conseil : Mentionnez le médium, l'année, le style artistique, et ce que représente l'œuvre.</p>
              </div>
            }
          />
        </label>
        <textarea
          id="metaDescription"
          {...register("metaDescription", { required: true })}
          className={`${styles.formTextarea} ${errors.metaDescription ? styles.formInputError : ''}`}
          rows={3}
          placeholder="Description optimisée pour les moteurs de recherche"
          maxLength={160}
        />
        {errors.metaDescription && <p className={styles.formError}>La description SEO est requise</p>}
      </div>
    </FormSection>
  )
}

export default SeoSection 