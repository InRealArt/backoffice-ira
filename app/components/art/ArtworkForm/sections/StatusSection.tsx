import { FormFields } from "../types";
import FormSection from "../FormSection";

interface StatusSectionProps extends FormFields {
  isFormReadOnly?: boolean;
}

function StatusSection({
  register,
  errors,
  setValue,
  getValues,
  isFormReadOnly = false,
}: StatusSectionProps) {
  const commercialStatus = getValues("commercialStatus") || "AVAILABLE";

  return (
    <FormSection title="Statut commercial" bgVariant="subtle-4">
      <p className="form-help mb-4">
        Définissez le statut commercial de l'œuvre physique
      </p>

      <div className="space-y-3">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="radio"
            value="AVAILABLE"
            {...register("commercialStatus", {
              required: "Le statut commercial est obligatoire",
            })}
            checked={commercialStatus === "AVAILABLE"}
            onChange={(e) => {
              setValue("commercialStatus", e.target.value, {
                shouldValidate: true,
              });
            }}
            disabled={isFormReadOnly}
            className="w-4 h-4 text-primary focus:ring-primary focus:ring-2"
          />
          <span className="text-gray-900 dark:text-gray-100 font-medium">
            Disponible
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            - L'œuvre est disponible à la vente
          </span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="radio"
            value="UNAVAILABLE"
            {...register("commercialStatus", {
              required: "Le statut commercial est obligatoire",
            })}
            checked={commercialStatus === "UNAVAILABLE"}
            onChange={(e) => {
              setValue("commercialStatus", e.target.value, {
                shouldValidate: true,
              });
            }}
            disabled={isFormReadOnly}
            className="w-4 h-4 text-primary focus:ring-primary focus:ring-2"
          />
          <span className="text-gray-900 dark:text-gray-100 font-medium">
            Indisponible
          </span>
          <span className="text-sm text-gray-600 dark:text-gray-400">
            - L'œuvre n'est pas disponible à la vente
          </span>
        </label>
      </div>

      {errors.commercialStatus && (
        <p className="form-error mt-2">
          {String(errors.commercialStatus?.message)}
        </p>
      )}
    </FormSection>
  );
}

export default StatusSection;

