import { FormFields, TagsSectionProps } from '../types'
import { TagInput } from '@/app/components/Tag/TagInput'
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
      <div className="mb-6">
        <label className="flex items-center gap-1">
          Tags
        </label>
        <TagInput
          placeholder="Ajouter des tags..."
          value={tags}
          onChange={setTags}
          maxTags={10}
          className="form-input"
        />
        <p className="form-help">
          Entrez des tags et appuyez sur Entrée pour ajouter. Maximum 10 tags.
        </p>
      </div>
    </FormSection>
  )
}

export default TagsSection 