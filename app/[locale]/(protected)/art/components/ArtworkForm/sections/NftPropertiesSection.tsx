import { FormFields } from '../types'
import FormSection from '../FormSection'

function NftPropertiesSection({ register, errors, control, setValue, getValues }: FormFields) {
  return (
    <FormSection title="Caractéristiques NFT" bgVariant="subtle-5">
      {/* Prix du NFT */}
      <div className="mb-6">
        <label htmlFor="priceNftBeforeTax" className="flex items-center gap-1" data-required={true}>
          Prix du NFT (HT)
        </label>
        <input
          id="priceNftBeforeTax"
          type="number"
          {...register("priceNftBeforeTax", {
            required: true,
            min: {
              value: 0,
              message: "Le prix doit être supérieur ou égal à 0"
            }
          })}
          className={`form-input ${errors.priceNftBeforeTax ? 'input-error' : ''}`}
          placeholder="Prix HT en euros"
        />
        {errors.priceNftBeforeTax && <p className="form-error">{String(errors.priceNftBeforeTax?.message || "Le prix est requis")}</p>}
      </div>
      
      {/* Note explicative sur les propriétés intellectuelles */}
      <div className="mt-6 p-5 bg-sky-50 border border-sky-200 rounded-md">
        <h4 className="mt-0 mb-3 text-sky-800 text-base font-semibold">Propriétés du NFT</h4>
        <p className="my-2 text-sky-900 text-sm">
          Le NFT sera créé sur la blockchain Ethereum et contiendra les métadonnées de l'œuvre, 
          y compris une référence à l'image et aux informations descriptives.
        </p>
        <p className="my-2 text-sky-900 text-sm">
          Assurez-vous que vous possédez les droits de propriété intellectuelle sur cette œuvre 
          avant de la transformer en NFT.
        </p>
      </div>
    </FormSection>
  )
}

export default NftPropertiesSection 