import { FormFields } from '../types'
import InfoTooltip from '../InfoTooltip'
import FormSection from '../FormSection'

function SeoSection({ register, errors }: FormFields) {
  return (
    <FormSection title="Informations SEO" bgVariant="subtle-1">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
        {/* Meta Title */}
        <div className="mb-6">
          <label htmlFor="metaTitle" className="flex items-center gap-1" data-required={true}>
            Titre SEO
            <InfoTooltip
              title="Titre SEO"
              content={
                <div>
                  <p>Ce titre sera utilisé dans les balises meta pour améliorer le référencement. Idéalement entre 50 et 60 caractères.</p>
                  <p className="text-sm text-gray-600"><strong>Exemple :</strong> "Nuit Étoilée - Peinture à l'huile par Jean Dupont | IN REAL ART"</p>
                  <p className="text-sm text-gray-600">Conseil : Incluez le nom de l'œuvre, la technique et l'artiste.</p>
                </div>
              }
            />
          </label>
          <input
            id="metaTitle"
            type="text"
            {...register("metaTitle", { required: true })}
            className={`form-input ${errors.metaTitle ? 'input-error' : ''}`}
            placeholder="Titre optimisé pour les moteurs de recherche"
            maxLength={60}
          />
          {errors.metaTitle && <p className="form-error">Le titre SEO est requis</p>}
        </div>
      </div>
      
      {/* Meta Description */}
      <div className="mb-6">
        <label htmlFor="metaDescription" className="flex items-center gap-1" data-required={true}>
          Description SEO
          <InfoTooltip
            title="Description SEO"
            content={
              <div>
                <p>Cette description sera utilisée dans les balises meta pour améliorer le référencement. Idéalement entre 120 et 160 caractères.</p>
                <p className="text-sm text-gray-600"><strong>Exemple :</strong> "Découvrez 'Nuit Étoilée', une œuvre originale à l'huile sur toile par Jean Dupont. Créée en 2023, cette peinture expressionniste représente un paysage nocturne avec une technique unique de couches texturées."</p>
                <p className="text-sm text-gray-600">Conseil : Mentionnez le médium, l'année, le style artistique, et ce que représente l'œuvre.</p>
              </div>
            }
          />
        </label>
        <textarea
          id="metaDescription"
          {...register("metaDescription", { required: true })}
          className={`form-textarea ${errors.metaDescription ? 'input-error' : ''}`}
          rows={3}
          placeholder="Description optimisée pour les moteurs de recherche"
          maxLength={160}
        />
        {errors.metaDescription && <p className="form-error">La description SEO est requise</p>}
      </div>
    </FormSection>
  )
}

export default SeoSection 