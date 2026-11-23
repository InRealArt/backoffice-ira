"use client";

import type { FieldErrors, UseFormRegister } from "react-hook-form";
import Button from "@/app/components/Button/Button";
import { FormActions, FormSection, formKit } from "@/app/components/Forms/FormKit/FormKit";

export interface CollectionFormValues {
  name: string;
  description: string;
}

interface CollectionFormViewProps {
  register: UseFormRegister<CollectionFormValues>;
  errors: FieldErrors<CollectionFormValues>;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  onCancel: () => void;
  isSubmitting: boolean;
  formError: string | null;
  submitLabel: string;
  submittingLabel: string;
}

// Vue partagée de la création et de l'édition d'une collection physique
export default function CollectionFormView({
  register,
  errors,
  onSubmit,
  onCancel,
  isSubmitting,
  formError,
  submitLabel,
  submittingLabel,
}: CollectionFormViewProps) {
  return (
    <form onSubmit={onSubmit} className={formKit.form}>
      {formError && (
        <div role="alert" className="alert alert-error">
          <p>{formError}</p>
        </div>
      )}

      <FormSection title="Informations de la collection">
        <div className="form-group">
          <label htmlFor="name" className="form-label">
            Nom de la collection *
          </label>
          <input
            id="name"
            type="text"
            {...register("name")}
            className={`form-input ${errors.name ? "input-error" : ""}`}
            placeholder="Ex: Collection Printemps 2024"
          />
          {errors.name && <p className="form-error">{errors.name.message}</p>}
        </div>

        <div className="form-group">
          <label htmlFor="description" className="form-label">
            Description *
          </label>
          <textarea
            id="description"
            {...register("description")}
            className={`form-textarea ${errors.description ? "input-error" : ""}`}
            rows={5}
            placeholder="Décrivez votre collection, son thème, son inspiration..."
          />
          {errors.description && (
            <p className="form-error">{errors.description.message}</p>
          )}
          <p className="form-help">
            Cette description sera visible pour les visiteurs de votre collection.
          </p>
        </div>
      </FormSection>

      <FormActions>
        <Button type="button" onClick={onCancel} variant="secondary" disabled={isSubmitting}>
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? submittingLabel : submitLabel}
        </Button>
      </FormActions>
    </form>
  );
}
