import { FormFields } from '../types'
import FormSection from '../FormSection'

interface PhysicalPropertiesSectionProps extends FormFields {
  isFormReadOnly?: boolean
}

function PhysicalPropertiesSection({ 
  register, 
  errors, 
  control, 
  setValue, 
  getValues,
  isFormReadOnly = false
}: PhysicalPropertiesSectionProps) {
  return (
    <FormSection title="Caractéristiques physiques">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
        {/* Prix de l'œuvre physique */}
        <div className="mb-6">
          <label htmlFor="pricePhysicalBeforeTax" className="flex items-center gap-1" data-required={true}>
            Prix de l'œuvre physique (HT)
          </label>
          <input
            id="pricePhysicalBeforeTax"
            type="number"
            {...register("pricePhysicalBeforeTax", {
              required: true,
              min: {
                value: 0,
                message: "Le prix doit être supérieur ou égal à 0"
              }
            })}
            className={`form-input ${errors.pricePhysicalBeforeTax ? 'input-error' : ''}`}
            placeholder="Prix HT en euros"
            disabled={isFormReadOnly}
          />
          {errors.pricePhysicalBeforeTax && <p className="form-error">{String(errors.pricePhysicalBeforeTax?.message || "Le prix est requis")}</p>}
        </div>

        {/* Quantité initiale */}
        <div className="mb-6">
          <label htmlFor="initialQty" className="flex items-center gap-1" data-required={true}>
            Quantité disponible
          </label>
          <input
            id="initialQty"
            type="number"
            {...register("initialQty", {
              required: true,
              min: {
                value: 1,
                message: "La quantité doit être au moins de 1"
              }
            })}
            className={`form-input ${errors.initialQty ? 'input-error' : ''}`}
            placeholder="Quantité disponible"
            disabled={isFormReadOnly}
          />
          {errors.initialQty && <p className="form-error">{String(errors.initialQty?.message || "La quantité est requise")}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
        {/* Largeur */}
        <div className="mb-6">
          <label htmlFor="width" className="flex items-center gap-1" data-required={true}>
            Largeur (cm)
          </label>
          <input
            id="width"
            type="number"
            step="0.01"
            {...register("width", {
              required: true,
              validate: value => !isNaN(parseFloat(value)) || "La largeur doit être un nombre valide"
            })}
            className={`form-input ${errors.width ? 'input-error' : ''}`}
            placeholder="Largeur en cm"
            disabled={isFormReadOnly}
          />
          {errors.width && <p className="form-error">{String(errors.width?.message || "La largeur est requise")}</p>}
        </div>

        {/* Hauteur */}
        <div className="mb-6">
          <label htmlFor="height" className="flex items-center gap-1" data-required={true}>
            Hauteur (cm)
          </label>
          <input
            id="height"
            type="number"
            step="0.01"
            {...register("height", {
              required: true,
              validate: value => !isNaN(parseFloat(value)) || "La hauteur doit être un nombre valide"
            })}
            className={`form-input ${errors.height ? 'input-error' : ''}`}
            placeholder="Hauteur en cm"
            disabled={isFormReadOnly}
          />
          {errors.height && <p className="form-error">{String(errors.height?.message || "La hauteur est requise")}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6">
        {/* Poids */}
        <div className="mb-6">
          <label htmlFor="weight" className="flex items-center gap-1" data-required={true}>
            Poids (kg)
          </label>
          <input
            id="weight"
            type="number"
            step="0.01"
            {...register("weight", {
              required: true
            })}
            className={`form-input ${errors.weight ? 'input-error' : ''}`}
            placeholder="Poids en kg"
            disabled={isFormReadOnly}
          />
          {errors.weight && <p className="form-error">{String(errors.weight?.message || "Le poids est requis")}</p>}
        </div>

        {/* Année de création */}
        <div className="mb-6">
          <label htmlFor="creationYear" className="flex items-center gap-1">
            Année de création
          </label>
          <input
            id="creationYear"
            type="number"
            max={new Date().getFullYear()}
            {...register("creationYear")}
            className={`form-input ${errors.creationYear ? 'input-error' : ''}`}
            placeholder="Année de création"
            disabled={isFormReadOnly}
          />
          {errors.creationYear && <p className="form-error">{String(errors.creationYear?.message)}</p>}
        </div>
      </div>
    </FormSection>
  )
}

export default PhysicalPropertiesSection