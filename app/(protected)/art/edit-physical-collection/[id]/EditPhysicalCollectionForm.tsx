"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/components/Toast/ToastContext";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updatePhysicalCollection,
  PhysicalCollection,
} from "@/lib/actions/physical-collection-actions";
import Button from "@/app/components/Button/Button";

// Schéma de validation pour la collection
const formSchema = z.object({
  name: z
    .string()
    .min(1, "Le nom de la collection est requis")
    .max(255, "Le nom ne peut pas dépasser 255 caractères"),
  description: z
    .string()
    .min(10, "La description doit contenir au moins 10 caractères"),
});

type FormValues = z.infer<typeof formSchema>;

interface EditPhysicalCollectionFormProps {
  collection: PhysicalCollection;
}

export default function EditPhysicalCollectionForm({
  collection,
}: EditPhysicalCollectionFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: collection.name,
      description: collection.description,
    },
  });

  // Réinitialiser le formulaire si la collection change
  useEffect(() => {
    reset({
      name: collection.name,
      description: collection.description,
    });
  }, [collection, reset]);

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      const result = await updatePhysicalCollection(collection.id, {
        name: data.name,
        description: data.description,
      });

      if (result.success) {
        toast.success("Collection mise à jour avec succès");
        router.push("/art/physicalCollection");
      } else {
        setFormError(result.message || "Une erreur est survenue");
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la collection:", error);
      setFormError("Une erreur inattendue est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/art/physicalCollection");
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {formError && (
        <div className="alert alert-error mb-4">
          <p>{formError}</p>
        </div>
      )}

      {/* Section Informations de base */}
      <div className="space-y-4">
        <h3 className="text-xl font-semibold mb-3 pb-2 border-b-2 border-gray-300">
          Informations de la collection
        </h3>

        <div className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nom de la collection *
            </label>
            <input
              id="name"
              type="text"
              {...register("name")}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Ex: Collection Printemps 2024"
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description *
            </label>
            <textarea
              id="description"
              {...register("description")}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.description ? "border-red-500" : "border-gray-300"
              }`}
              rows={5}
              placeholder="Décrivez votre collection, son thème, son inspiration..."
            />
            {errors.description && (
              <p className="text-red-500 text-sm mt-1">
                {errors.description.message}
              </p>
            )}
            <p className="text-gray-500 text-sm mt-1">
              Cette description sera visible pour les visiteurs de votre
              collection.
            </p>
          </div>
        </div>
      </div>

      {/* Actions du formulaire */}
      <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
        <Button
          type="button"
          onClick={handleCancel}
          variant="secondary"
          disabled={isSubmitting}
          className="px-6 py-2"
        >
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting} className="px-6 py-2">
          {isSubmitting ? "Mise à jour en cours..." : "Mettre à jour la collection"}
        </Button>
      </div>
    </form>
  );
}

