import { FormFields } from "../types";
import InfoTooltip from "../InfoTooltip";
import FormSection from "../FormSection";

function MainInfoSection({
  register,
  errors,
  setValue,
  slug = "",
  title = "",
  onNameChange,
}: FormFields & {
  title?: string;
  onTitleChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNameChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <FormSection title="Caractéristiques principales" bgVariant="default">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-6 w-full max-w-full">
        {/* Name */}
        <div className="mb-6 min-w-0 max-w-full">
          <label
            htmlFor="name"
            className="flex items-center gap-1"
            data-required={true}
          >
            Nom
          </label>
          <input
            id="name"
            type="text"
            {...register("name", {
              required: true,
              onChange: onNameChange, // Appeler le gestionnaire de changement de name
            })}
            className={`form-input ${errors.name ? "input-error" : ""}`}
            placeholder="Entrez le nom de l'œuvre"
            defaultValue={title}
          />
          {errors.name && <p className="form-error">Le nom est requis</p>}
        </div>

        {/* Slug généré automatiquement */}
        {/* <div className="mb-6">
          <label htmlFor="slug" className="flex items-center gap-1">
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
            className="form-input bg-gray-100 text-gray-600 cursor-not-allowed"
          />
          <p className="form-help">Ce champ est généré automatiquement à partir du nom</p>
        </div> */}
      </div>

      {/* Description */}
      <div className="mb-6">
        <label htmlFor="description" className="flex items-center gap-1">
          Description
        </label>
        <textarea
          id="description"
          {...register("description")}
          className={`form-textarea ${errors.description ? "input-error" : ""}`}
          rows={4}
          placeholder="Décrivez l'œuvre..."
        />
      </div>
    </FormSection>
  );
}

export default MainInfoSection;
