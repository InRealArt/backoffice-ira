"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/components/Toast/ToastContext";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPhysicalCollection } from "@/lib/actions/physical-collection-actions";
import CollectionFormView from "../components/CollectionFormView";

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

export default function CreatePhysicalCollectionForm() {
  const router = useRouter();
  const toast = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true);
    setFormError(null);

    try {
      const result = await createPhysicalCollection({
        name: data.name,
        description: data.description,
      });

      if (result.success) {
        toast.success("Collection créée avec succès");
        router.push("/art/physicalCollection");
      } else {
        setFormError(result.message || "Une erreur est survenue");
      }
    } catch (error) {
      console.error("Erreur lors de la création de la collection:", error);
      setFormError("Une erreur inattendue est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/art/physicalCollection");
  };

  return (
    <CollectionFormView
      register={register}
      errors={errors}
      onSubmit={handleSubmit(onSubmit)}
      onCancel={handleCancel}
      isSubmitting={isSubmitting}
      formError={formError}
      submitLabel="Créer la collection"
      submittingLabel="Création en cours..."
    />
  );
}
