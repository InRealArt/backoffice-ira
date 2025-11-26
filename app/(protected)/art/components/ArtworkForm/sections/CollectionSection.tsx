"use client";

import { FieldErrors, UseFormRegister } from "react-hook-form";
import { PhysicalArtworkFormData } from "../../../createPhysicalArtwork/schema";
import FormSection from "../FormSection";
import { useRouter } from "next/navigation";
import Button from "@/app/components/Button/Button";
import { Plus } from "lucide-react";

export interface PhysicalCollection {
  id: number;
  name: string;
  description: string;
  landingArtistId: number;
}

interface CollectionSectionProps {
  register: UseFormRegister<PhysicalArtworkFormData>;
  errors: FieldErrors<PhysicalArtworkFormData>;
  isFormReadOnly: boolean;
  collections: PhysicalCollection[];
}

export default function CollectionSection({
  register,
  errors,
  isFormReadOnly,
  collections,
}: CollectionSectionProps) {
  const router = useRouter();

  return (
    <FormSection title="Collection" bgVariant="default">
      <div className="mb-6">
        <label
          htmlFor="physicalCollectionId"
          className="flex items-center gap-1 mb-2"
          data-required={true}
        >
          Collection
          <span className="text-red-500 ml-1">*</span>
        </label>
        <div className="flex items-start gap-3">
          <div className="flex-1 max-w-md">
            <select
              id="physicalCollectionId"
              {...register("physicalCollectionId", {
                required: "La collection est obligatoire",
              })}
              className={`form-select w-full ${
                errors.physicalCollectionId ? "input-error" : ""
              }`}
              disabled={isFormReadOnly}
            >
              <option value="">Sélectionnez une collection</option>
              {collections.map((collection) => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </select>
            {errors.physicalCollectionId && (
              <p className="form-error mt-1">
                {errors.physicalCollectionId.message as string}
              </p>
            )}

            {collections.length === 0 && (
              <div className="form-help text-red-600 mt-2">
                Aucune collection disponible. Veuillez d'abord créer une collection.
              </div>
            )}
          </div>
          <div className="flex-shrink-0 pt-0">
            <Button
              type="button"
              variant="secondary"
              size="medium"
              onClick={() => router.push("/art/create-physical-collection")}
              disabled={isFormReadOnly}
              className="whitespace-nowrap"
            >
              <Plus size={16} className="mr-2" />
              Créer collection
            </Button>
          </div>
        </div>
      </div>
    </FormSection>
  );
}

