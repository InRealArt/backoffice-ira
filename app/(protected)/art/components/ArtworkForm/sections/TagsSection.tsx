import { FormFields, TagsSectionProps } from '../types'
import { TagInput } from '@/app/components/Tag/TagInput'
import styles from '../../ArtworkForm.module.scss'
import FormSection from '../FormSection'

function TagsSection({
  register,
  errors,
  setValue,
  control,
  getValues,
  tags,
  setTags
}: TagsSectionProps) {
  return (
    <FormSection title="Tags et catégories">
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>
          Tags
        </label>
        <TagInput
          placeholder="Ajouter des tags..."
          value={tags}
          onChange={setTags}
          maxTags={10}
          className={styles.formInput}
        />
        <p className={styles.formHelp}>
          Entrez des tags et appuyez sur Entrée pour ajouter. Maximum 10 tags.
        </p>
      </div>
    </FormSection>
  )
}

export default TagsSection 