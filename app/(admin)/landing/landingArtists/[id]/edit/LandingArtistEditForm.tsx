"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/components/Toast/ToastContext";
import Image from "next/image";
import { z } from "zod";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, Plus } from "lucide-react";
import { updateLandingArtistAction } from "@/lib/actions/landing-artist-actions";
import TranslationField from "@/app/components/TranslationField";
import { handleEntityTranslations } from "@/lib/actions/translation-actions";
import { generateSlug } from "@/lib/utils";
import MediumMultiSelect from "@/app/components/Common/MediumMultiSelect";
import CategoryMultiSelect from "@/app/components/Common/CategoryMultiSelect";
import type { ArtistCategory } from "@prisma/client";
import ArtistImageUpload from "@/app/(protected)/art/create-artist-profile/ArtistImageUpload";
import OptionalImageUpload from "@/app/(protected)/art/create-artist-profile/OptionalImageUpload";
import ProgressModal from "@/app/(protected)/art/create-artist-profile/ProgressModal";

// Schéma de validation
const formSchema = z.object({
  intro: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  artworkStyle: z.string().nullable().optional(),
  artistsPage: z.boolean().default(false),
  imageUrl: z.string().optional(), // Sera rempli après l'upload si nouveau fichier
  secondaryImageUrl: z.string().nullable().optional(),
  websiteUrl: z
    .string()
    .refine((val) => val === "" || /^https?:\/\//.test(val), {
      message: "URL invalide",
    })
    .optional()
    .transform((val) => (val === "" ? null : val)),
  facebookUrl: z
    .string()
    .refine((val) => val === "" || /^https?:\/\//.test(val), {
      message: "URL Facebook invalide",
    })
    .optional()
    .transform((val) => (val === "" ? null : val)),
  instagramUrl: z
    .string()
    .refine((val) => val === "" || /^https?:\/\//.test(val), {
      message: "URL Instagram invalide",
    })
    .optional()
    .transform((val) => (val === "" ? null : val)),
  twitterUrl: z
    .string()
    .refine((val) => val === "" || /^https?:\/\//.test(val), {
      message: "URL Twitter invalide",
    })
    .optional()
    .transform((val) => (val === "" ? null : val)),
  linkedinUrl: z
    .string()
    .refine((val) => val === "" || /^https?:\/\//.test(val), {
      message: "URL LinkedIn invalide",
    })
    .optional()
    .transform((val) => (val === "" ? null : val)),
  slug: z.string().optional(),
  categoryIds: z.array(z.string()).optional(),
  mediumTags: z.array(z.string()).default([]),
  quoteFromInRealArt: z.string().optional(),
  biographyHeader1: z.string().optional(),
  biographyText1: z.string().optional(),
  biographyHeader2: z.string().optional(),
  biographyText2: z.string().optional(),
  biographyHeader3: z.string().optional(),
  biographyText3: z.string().optional(),
  biographyHeader4: z.string().optional(),
  biographyText4: z.string().optional(),
  imageArtistStudio: z.string().nullable().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface LandingArtistWithArtist {
  id: number;
  intro: string | null;
  description: string | null;
  artworkImages: any;
  artworkStyle: string | null;
  artistsPage: boolean | null;
  imageUrl: string;
  secondaryImageUrl?: string | null;
  artistId: number;
  artistCategories?: { categoryId: number }[];
  quoteFromInRealArt?: string | null;
  biographyHeader1?: string | null;
  biographyText1?: string | null;
  biographyHeader2?: string | null;
  biographyText2?: string | null;
  biographyHeader3?: string | null;
  biographyText3?: string | null;
  biographyHeader4?: string | null;
  biographyText4?: string | null;
  mediumTags?: string[];
  imageArtistStudio?: string | null;
  artist: {
    id: number;
    name: string;
    surname: string;
    pseudo: string;
    websiteUrl: string | null;
    facebookUrl: string | null;
    instagramUrl: string | null;
    twitterUrl: string | null;
    linkedinUrl: string | null;
    countryCode?: string | null;
    birthYear?: number | null;
  };
  slug?: string;
}

interface LandingArtistEditFormProps {
  landingArtist: LandingArtistWithArtist;
  mediums: string[];
  categories: ArtistCategory[];
}

export default function LandingArtistEditForm({
  landingArtist,
  mediums,
  categories,
}: LandingArtistEditFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [secondaryImageFile, setSecondaryImageFile] = useState<File | null>(
    null
  );
  const [studioImageFile, setStudioImageFile] = useState<File | null>(null);
  const [deletedMainImage, setDeletedMainImage] = useState(false);
  const [deletedSecondaryImage, setDeletedSecondaryImage] = useState(false);
  const [deletedStudioImage, setDeletedStudioImage] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressSteps, setProgressSteps] = useState<
    Array<{
      id: string;
      label: string;
      status: "pending" | "in-progress" | "completed" | "error";
    }>
  >([
    { id: "validation", label: "Validation des données", status: "pending" },
    {
      id: "conversion",
      label: "Conversion de l'image en WebP",
      status: "pending",
    },
    { id: "upload", label: "Upload vers Firebase", status: "pending" },
    {
      id: "update",
      label: "Mise à jour de l'artiste landing",
      status: "pending",
    },
    {
      id: "translations",
      label: "Mise à jour des traductions",
      status: "pending",
    },
    { id: "finalization", label: "Finalisation", status: "pending" },
  ]);
  const [progressError, setProgressError] = useState<string | undefined>(
    undefined
  );
  const [artworkImages, setArtworkImages] = useState<
    { name: string; url: string }[]
  >(() => {
    // Parse le champ artworkImages qui peut être une chaîne JSON ou un tableau
    if (!landingArtist.artworkImages) {
      return [];
    }

    if (typeof landingArtist.artworkImages === "string") {
      try {
        const parsed = JSON.parse(landingArtist.artworkImages);
        // Conversion d'anciens formats (simples URLs) vers le nouveau format {name, url}
        if (Array.isArray(parsed)) {
          return parsed.map((item) => {
            if (typeof item === "string") {
              return { name: "", url: item };
            } else if (typeof item === "object" && item.url) {
              return item;
            }
            return { name: "", url: "" };
          });
        }
        return [];
      } catch (e) {
        console.error("Erreur lors du parsing des images:", e);
        return [];
      }
    }

    // Si c'est déjà un tableau (cast depuis any)
    const images = landingArtist.artworkImages as any[];
    return images.map((item) => {
      if (typeof item === "string") {
        return { name: "", url: item };
      } else if (typeof item === "object" && item.url) {
        return item;
      }
      return { name: "", url: "" };
    });
  });
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageName, setNewImageName] = useState("");
  const [slug, setSlug] = useState("");
  const { success, error } = useToast();
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      intro: landingArtist.intro || "",
      description: landingArtist.description || "",
      artworkStyle: landingArtist.artworkStyle || "",
      artistsPage: landingArtist.artistsPage || false,
      imageUrl: landingArtist.imageUrl,
      secondaryImageUrl: landingArtist.secondaryImageUrl || "",
      websiteUrl: landingArtist.artist.websiteUrl || "",
      facebookUrl: landingArtist.artist.facebookUrl || "",
      instagramUrl: landingArtist.artist.instagramUrl || "",
      twitterUrl: landingArtist.artist.twitterUrl || "",
      linkedinUrl: landingArtist.artist.linkedinUrl || "",
      slug: landingArtist.slug || "",
      categoryIds: Array.isArray(landingArtist.artistCategories)
        ? (landingArtist.artistCategories as { categoryId: number }[]).map(
            (c) => String(c.categoryId)
          )
        : [],
      mediumTags: landingArtist.mediumTags || [],
      quoteFromInRealArt: landingArtist.quoteFromInRealArt || "",
      biographyHeader1: landingArtist.biographyHeader1 || "",
      biographyText1: landingArtist.biographyText1 || "",
      biographyHeader2: landingArtist.biographyHeader2 || "",
      biographyText2: landingArtist.biographyText2 || "",
      biographyHeader3: landingArtist.biographyHeader3 || "",
      biographyText3: landingArtist.biographyText3 || "",
      biographyHeader4: landingArtist.biographyHeader4 || "",
      biographyText4: landingArtist.biographyText4 || "",
      imageArtistStudio: landingArtist.imageArtistStudio || "",
    },
  });

  // Utiliser useWatch pour optimiser les re-renders (best practice React Hook Form)
  const artistsPage = useWatch({ control, name: "artistsPage" });
  const mediumTags = useWatch({ control, name: "mediumTags" }) || [];
  const categoryIds = useWatch({ control, name: "categoryIds" }) || [];

  useEffect(() => {
    // Générer le slug à partir des informations de l'artiste
    const generatedSlug = generateSlug(
      landingArtist.artist.name + " " + landingArtist.artist.surname
    );
    setSlug(generatedSlug);
    setValue("slug", generatedSlug);
  }, [landingArtist.artist.name, landingArtist.artist.surname, setValue]);

  // Mémoriser updateStepStatus avec useCallback (best practice React)
  const updateStepStatus = useCallback(
    (
      stepId: string,
      status: "pending" | "in-progress" | "completed" | "error"
    ) => {
      setProgressSteps((prev) =>
        prev.map((step) => (step.id === stepId ? { ...step, status } : step))
      );
    },
    []
  );

  // Fonction d'upload côté client pour les images d'artiste (mémorisée avec useCallback)
  const handleUpload = useCallback(
    async (
      imageFile: File,
      name: string,
      surname: string,
      imageType: "profile" | "secondary" | "studio" = "profile"
    ): Promise<string> => {
      const { uploadArtistImageWithWebP } = await import(
        "@/lib/firebase/storage"
      );

      try {
        return await uploadArtistImageWithWebP(imageFile, {
          name,
          surname,
          imageType,
          normalizeFolderName: true,
          onConversionStatus: (status, error) => {
            updateStepStatus("conversion", status);
          },
          onUploadStatus: (status, error) => {
            updateStepStatus("upload", status);
          },
        });
      } catch (error) {
        throw error;
      }
    },
    [updateStepStatus]
  );

  // Mémoriser les callbacks de suppression d'images (best practice React)
  const handleDeleteMainImage = useCallback(async () => {
    if (landingArtist.imageUrl) {
      try {
        const { deleteImageFromFirebase } = await import(
          "@/lib/firebase/storage"
        );
        await deleteImageFromFirebase(landingArtist.imageUrl);
        setDeletedMainImage(true);
        setSelectedImageFile(null);
        success("Image principale supprimée");
      } catch (err) {
        console.error(
          "Erreur lors de la suppression de l'image principale:",
          err
        );
        error("Erreur lors de la suppression de l'image principale");
      }
    }
  }, [landingArtist.imageUrl, success, error]);

  const handleDeleteSecondaryImage = useCallback(async () => {
    if (landingArtist.secondaryImageUrl) {
      try {
        const { deleteImageFromFirebase } = await import(
          "@/lib/firebase/storage"
        );
        await deleteImageFromFirebase(landingArtist.secondaryImageUrl);
        setDeletedSecondaryImage(true);
        setSecondaryImageFile(null);
        success("Image secondaire supprimée");
      } catch (err) {
        console.error(
          "Erreur lors de la suppression de l'image secondaire:",
          err
        );
        error("Erreur lors de la suppression de l'image secondaire");
      }
    }
  }, [landingArtist.secondaryImageUrl, success, error]);

  const handleDeleteStudioImage = useCallback(async () => {
    if (landingArtist.imageArtistStudio) {
      try {
        const { deleteImageFromFirebase } = await import(
          "@/lib/firebase/storage"
        );
        await deleteImageFromFirebase(landingArtist.imageArtistStudio!);
        setDeletedStudioImage(true);
        setStudioImageFile(null);
        success("Image d'atelier supprimée");
      } catch (err) {
        console.error(
          "Erreur lors de la suppression de l'image d'atelier:",
          err
        );
        error("Erreur lors de la suppression de l'image d'atelier");
      }
    }
  }, [landingArtist.imageArtistStudio, success, error]);

  const onSubmit = async (data: FormValues) => {
    setFormError(null);
    setIsSubmitting(true);
    setShowProgressModal(true);
    setProgressError(undefined);

    // Réinitialiser les étapes
    setProgressSteps([
      { id: "validation", label: "Validation des données", status: "pending" },
      {
        id: "conversion",
        label: "Conversion de l'image en WebP",
        status: "pending",
      },
      { id: "upload", label: "Upload vers Firebase", status: "pending" },
      {
        id: "update",
        label: "Mise à jour de l'artiste landing",
        status: "pending",
      },
      {
        id: "translations",
        label: "Mise à jour des traductions",
        status: "pending",
      },
      { id: "finalization", label: "Finalisation", status: "pending" },
    ]);

    try {
      // Étape 1: Validation
      updateStepStatus("validation", "in-progress");

      // Vérifier qu'une image principale existe (soit un fichier sélectionné, soit l'image existante non supprimée)
      if (!selectedImageFile && (deletedMainImage || !landingArtist.imageUrl)) {
        updateStepStatus("validation", "error");
        setProgressError("Veuillez sélectionner une image principale");
        setFormError("Veuillez sélectionner une image principale");
        error("Veuillez sélectionner une image principale");
        setIsSubmitting(false);
        return;
      }

      // Vérifier que le répertoire Firebase existe (doit être fait en premier)
      const { checkFolderExists } = await import("@/lib/firebase/storage");
      const folderName = `${landingArtist.artist.name} ${landingArtist.artist.surname}`;
      const folderPath = `artists/${folderName}`;

      try {
        const folderExists = await checkFolderExists(
          folderPath,
          landingArtist.artist.name,
          landingArtist.artist.surname
        );

        if (!folderExists) {
          updateStepStatus("validation", "error");
          const errorMessage = `Le répertoire "${folderPath}" n'existe pas dans Firebase Storage. Veuillez d'abord créer le profil artiste (public.artist) avec son image principale.`;
          setProgressError(errorMessage);
          setFormError(errorMessage);
          error(errorMessage);
          setIsSubmitting(false);
          return;
        }
      } catch (checkError: any) {
        updateStepStatus("validation", "error");
        const errorMessage = `Erreur lors de la vérification du répertoire Firebase "${folderPath}": ${
          checkError?.message || "Erreur inconnue"
        }`;
        setProgressError(errorMessage);
        setFormError(errorMessage);
        error(errorMessage);
        setIsSubmitting(false);
        return;
      }

      updateStepStatus("validation", "completed");

      // Upload des images si de nouveaux fichiers ont été sélectionnés
      let imageUrl: string | null = deletedMainImage
        ? null
        : landingArtist.imageUrl;
      let secondaryImageUrl: string | null = deletedSecondaryImage
        ? null
        : landingArtist.secondaryImageUrl || null;
      let studioImageUrl: string | null = deletedStudioImage
        ? null
        : landingArtist.imageArtistStudio || null;

      try {
        // Upload de l'image principale si un nouveau fichier a été sélectionné
        if (selectedImageFile) {
          imageUrl = await handleUpload(
            selectedImageFile,
            landingArtist.artist.name,
            landingArtist.artist.surname,
            "profile"
          );
        } else if (!deletedMainImage && landingArtist.imageUrl) {
          // Utiliser l'image existante si elle n'a pas été supprimée
          imageUrl = landingArtist.imageUrl;
          updateStepStatus("conversion", "completed");
          updateStepStatus("upload", "completed");
        } else {
          // Image supprimée et aucun nouveau fichier
          imageUrl = null;
          updateStepStatus("conversion", "completed");
          updateStepStatus("upload", "completed");
        }

        // Upload de l'image secondaire si fournie (dans le répertoire existant avec casse exacte)
        if (secondaryImageFile) {
          try {
            const { uploadImageToExistingFolder } = await import(
              "@/lib/firebase/storage"
            );
            const fileName = `${landingArtist.artist.name} ${landingArtist.artist.surname}_2`;
            secondaryImageUrl = await uploadImageToExistingFolder(
              secondaryImageFile,
              folderName,
              fileName,
              (status, error) => {
                if (status === "error") {
                  updateStepStatus("conversion", status);
                } else {
                  updateStepStatus("conversion", status);
                }
              },
              (status, error) => {
                if (status === "error") {
                  updateStepStatus("upload", status);
                } else {
                  updateStepStatus("upload", status);
                }
              }
            );
          } catch (err: any) {
            console.error(
              "Erreur lors de l'upload de l'image secondaire:",
              err
            );
            const errorMessage =
              err?.message || "Erreur lors de l'upload de l'image secondaire";
            setProgressError(errorMessage);
            error(errorMessage);
            // Ne pas bloquer la soumission si l'image secondaire échoue
          }
        } else if (deletedSecondaryImage) {
          // Image supprimée et aucun nouveau fichier
          secondaryImageUrl = null;
        }

        // Upload de l'image du studio si fournie (dans le répertoire existant avec casse exacte)
        if (studioImageFile) {
          try {
            const { uploadImageToExistingFolder } = await import(
              "@/lib/firebase/storage"
            );
            const fileName = `${landingArtist.artist.name} ${landingArtist.artist.surname}_studio`;
            studioImageUrl = await uploadImageToExistingFolder(
              studioImageFile,
              folderName,
              fileName,
              (status, error) => {
                if (status === "error") {
                  updateStepStatus("conversion", status);
                } else {
                  updateStepStatus("conversion", status);
                }
              },
              (status, error) => {
                if (status === "error") {
                  updateStepStatus("upload", status);
                } else {
                  updateStepStatus("upload", status);
                }
              }
            );
          } catch (err: any) {
            console.error("Erreur lors de l'upload de l'image du studio:", err);
            const errorMessage =
              err?.message || "Erreur lors de l'upload de l'image du studio";
            setProgressError(errorMessage);
            error(errorMessage);
            // Ne pas bloquer la soumission si l'image du studio échoue
          }
        } else if (deletedStudioImage) {
          // Image supprimée et aucun nouveau fichier
          studioImageUrl = null;
        }
      } catch (uploadError: any) {
        // Détecter si c'est une erreur de conversion ou d'upload
        const errorMessage =
          uploadError?.message || "Erreur lors de l'upload de l'image";

        if (
          errorMessage.toLowerCase().includes("conversion") ||
          errorMessage.toLowerCase().includes("webp")
        ) {
          updateStepStatus("conversion", "error");
        } else {
          updateStepStatus("upload", "error");
        }

        setProgressError(errorMessage);
        setFormError(errorMessage);
        error(errorMessage);
        setIsSubmitting(false);
        return;
      }

      // Étape 4: Mise à jour de l'artiste landing
      updateStepStatus("update", "in-progress");

      // Transformer undefined en null pour intro et artworkStyle
      const formattedData = {
        ...data,
        intro: data.intro || null,
        description: data.description || null,
        artworkStyle: data.artworkStyle || null,
        artistsPage: data.artistsPage,
        imageUrl: imageUrl || "",
        secondaryImageUrl: secondaryImageUrl,
        mediumTags: Array.isArray(data.mediumTags) ? data.mediumTags : [],
        slug: data.slug || slug,
        quoteFromInRealArt:
          (data.quoteFromInRealArt ?? "").trim() === ""
            ? null
            : (data.quoteFromInRealArt ?? "").trim(),
        biographyHeader1:
          (data.biographyHeader1 ?? "").trim() === ""
            ? null
            : (data.biographyHeader1 ?? "").trim(),
        biographyText1:
          (data.biographyText1 ?? "").trim() === ""
            ? null
            : (data.biographyText1 ?? "").trim(),
        biographyHeader2:
          (data.biographyHeader2 ?? "").trim() === ""
            ? null
            : (data.biographyHeader2 ?? "").trim(),
        biographyText2:
          (data.biographyText2 ?? "").trim() === ""
            ? null
            : (data.biographyText2 ?? "").trim(),
        biographyHeader3:
          (data.biographyHeader3 ?? "").trim() === ""
            ? null
            : (data.biographyHeader3 ?? "").trim(),
        biographyText3:
          (data.biographyText3 ?? "").trim() === ""
            ? null
            : (data.biographyText3 ?? "").trim(),
        biographyHeader4:
          (data.biographyHeader4 ?? "").trim() === ""
            ? null
            : (data.biographyHeader4 ?? "").trim(),
        biographyText4:
          (data.biographyText4 ?? "").trim() === ""
            ? null
            : (data.biographyText4 ?? "").trim(),
        imageArtistStudio: studioImageUrl,
      };

      // Préparer les données d'artworkImages pour le format attendu par l'API
      const landingArtistDataWithImages = {
        ...formattedData,
        artworkImages: JSON.stringify(artworkImages),
      };

      // Appel à la server action pour mettre à jour l'artiste
      const result = await updateLandingArtistAction(landingArtist.id, {
        ...landingArtistDataWithImages,
        categoryIds: Array.isArray(categoryIds)
          ? categoryIds.map((v) => parseInt(v))
          : undefined,
      });

      updateStepStatus("update", "completed");

      if (result.success) {
        // Étape 5: Mise à jour des traductions
        updateStepStatus("translations", "in-progress");

        // Gestion des traductions pour intro, description et style artistique
        try {
          await handleEntityTranslations("LandingArtist", landingArtist.id, {
            intro: data.intro || null,
            description: data.description || null,
            artworkStyle: data.artworkStyle || null,
          });
        } catch (translationError) {
          console.error(
            "Erreur lors de la gestion des traductions LandingArtist:",
            translationError
          );
          updateStepStatus("translations", "error");
          setProgressError("Erreur lors de la mise à jour des traductions");
          // On ne bloque pas la mise à jour en cas d'erreur de traduction
        }

        // Gestion des traductions pour les champs de citations et biographies (LandingArtist)
        try {
          await handleEntityTranslations("LandingArtist", landingArtist.id, {
            quoteFromInRealArt: data.quoteFromInRealArt || null,
            biographyHeader1: data.biographyHeader1 || null,
            biographyText1: data.biographyText1 || null,
            biographyHeader2: data.biographyHeader2 || null,
            biographyText2: data.biographyText2 || null,
            biographyHeader3: data.biographyHeader3 || null,
            biographyText3: data.biographyText3 || null,
            biographyHeader4: data.biographyHeader4 || null,
            biographyText4: data.biographyText4 || null,
          });
        } catch (translationError) {
          console.error(
            "Erreur lors de la gestion des traductions LandingArtist:",
            translationError
          );
          updateStepStatus("translations", "error");
          setProgressError("Erreur lors de la mise à jour des traductions");
          // On ne bloque pas la mise à jour en cas d'erreur de traduction
        }

        updateStepStatus("translations", "completed");

        // Étape 6: Finalisation
        updateStepStatus("finalization", "in-progress");
        await new Promise((resolve) => setTimeout(resolve, 500)); // Petit délai pour l'UX
        updateStepStatus("finalization", "completed");

        success("Artiste mis à jour avec succès");

        // Fermer le modal après un court délai
        setTimeout(() => {
          setShowProgressModal(false);
          router.push("/landing/landingArtists");
          router.refresh();
        }, 1000);
      } else {
        updateStepStatus("update", "error");
        setProgressError(result.message || "Une erreur est survenue");
        error(result.message || "Une erreur est survenue");
        setIsSubmitting(false);
      }
    } catch (error: any) {
      console.error(
        "Erreur lors de la mise à jour de l'artiste landing:",
        error
      );
      const errorMessage =
        error?.message ||
        "Une erreur est survenue lors de la mise à jour de l'artiste landing";

      // Marquer l'étape de mise à jour comme erreur
      updateStepStatus("update", "error");

      setProgressError(errorMessage);
      error(errorMessage);
      setFormError("Une erreur est survenue");
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/landing/landingArtists");
  };

  const handleAddImage = () => {
    if (newImageUrl.trim() === "") return;

    // Ajouter la nouvelle image à la liste
    setArtworkImages([
      ...artworkImages,
      { name: newImageName, url: newImageUrl },
    ]);

    // Réinitialiser les champs
    setNewImageUrl("");
    setNewImageName("");
  };

  const handleRemoveImage = (index: number) => {
    const updatedImages = [...artworkImages];
    updatedImages.splice(index, 1);
    setArtworkImages(updatedImages);
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">Modifier l'artiste de la landing page</h1>
        </div>
        <p className="page-subtitle">
          Modifier les informations de {landingArtist.artist.name}{" "}
          {landingArtist.artist.surname} pour le site corpo et la marketplace
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="form-container">
        <div className="form-card">
          <div className="card-content">
            {formError && (
              <div className="alert alert-danger mb-4">
                <p>{formError}</p>
              </div>
            )}

            <div className="form-section mt-lg">
              <h2 className="section-title">Catégorie, Images & description</h2>
              <div className="form-group mb-lg">
                <label htmlFor="slug" className="form-label">
                  Slug (Généré automatiquement à partir du nom de l'artiste)
                </label>
                <input
                  id="slug"
                  type="text"
                  value={slug}
                  readOnly
                  className="form-input"
                  style={{ backgroundColor: "#f9f9f9" }}
                />
              </div>
              <div className="d-flex gap-lg align-items-start">
                <div style={{ width: "200px", flexShrink: 0 }}>
                  <ArtistImageUpload
                    onFileSelect={setSelectedImageFile}
                    previewUrl={
                      deletedMainImage ? null : landingArtist.imageUrl || null
                    }
                    allowDelete={true}
                    onDelete={handleDeleteMainImage}
                    error={
                      formError &&
                      !selectedImageFile &&
                      !landingArtist.imageUrl &&
                      !deletedMainImage
                        ? "Une image principale est requise"
                        : undefined
                    }
                  />
                </div>

                <div style={{ flex: 1 }}>
                  <div className="form-group">
                    <label className="form-label">Catégories</label>
                    <CategoryMultiSelect
                      options={useMemo(
                        () =>
                          categories.map((c) => ({
                            id: c.id,
                            name: c.name,
                          })),
                        [categories]
                      )}
                      selected={useMemo(
                        () => categoryIds.map((v) => parseInt(v)),
                        [categoryIds]
                      )}
                      onChange={useCallback(
                        (values: number[]) => {
                          setValue("categoryIds" as any, values.map(String), {
                            shouldValidate: true,
                          });
                        },
                        [setValue]
                      )}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Supports/Mediums</label>
                    <MediumMultiSelect
                      options={mediums}
                      selected={mediumTags || []}
                      onChange={useCallback(
                        (values: string[]) => {
                          setValue("mediumTags" as any, values, {
                            shouldValidate: true,
                          });
                        },
                        [setValue]
                      )}
                    />
                  </div>
                  <div className="form-group">
                    <div
                      className="d-flex align-items-center gap-md"
                      style={{ marginBottom: "20px" }}
                    >
                      <span
                        className={!artistsPage ? "text-primary" : "text-muted"}
                        style={{
                          fontWeight: !artistsPage ? "bold" : "normal",
                        }}
                      >
                        Non affiché
                      </span>
                      <label
                        className="d-flex align-items-center"
                        style={{
                          position: "relative",
                          display: "inline-block",
                          width: "60px",
                          height: "30px",
                        }}
                      >
                        <input
                          type="checkbox"
                          {...register("artistsPage")}
                          style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span
                          style={{
                            position: "absolute",
                            cursor: "pointer",
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: artistsPage ? "#4f46e5" : "#ccc",
                            borderRadius: "34px",
                            transition: "0.4s",
                          }}
                        >
                          <span
                            style={{
                              position: "absolute",
                              content: '""',
                              height: "22px",
                              width: "22px",
                              left: "4px",
                              bottom: "4px",
                              backgroundColor: "white",
                              borderRadius: "50%",
                              transition: "0.4s",
                              transform: artistsPage
                                ? "translateX(30px)"
                                : "translateX(0)",
                            }}
                          ></span>
                        </span>
                      </label>
                      <span
                        className={artistsPage ? "text-primary" : "text-muted"}
                        style={{
                          fontWeight: artistsPage ? "bold" : "normal",
                        }}
                      >
                        Affiché
                      </span>
                    </div>
                  </div>

                  <TranslationField
                    entityType="LandingArtist"
                    entityId={landingArtist.id}
                    field="intro"
                    label="Introduction"
                    errorMessage={errors.intro?.message}
                  >
                    <textarea
                      id="intro"
                      {...register("intro")}
                      className={`form-textarea ${
                        errors.intro ? "input-error" : ""
                      }`}
                      rows={3}
                      placeholder="Courte introduction de l'artiste qui sera affichée sur la page d'accueil"
                    />
                  </TranslationField>

                  <TranslationField
                    entityType="LandingArtist"
                    entityId={landingArtist.id}
                    field="description"
                    label="Description"
                    errorMessage={errors.description?.message}
                  >
                    <textarea
                      id="description"
                      {...register("description")}
                      className={`form-textarea ${
                        errors.description ? "input-error" : ""
                      }`}
                      rows={5}
                      placeholder="Description complète de l'artiste"
                    />
                  </TranslationField>

                  <TranslationField
                    entityType="LandingArtist"
                    entityId={landingArtist.id}
                    field="artworkStyle"
                    label="Style artistique"
                    errorMessage={errors.artworkStyle?.message}
                  >
                    <input
                      id="artworkStyle"
                      type="text"
                      {...register("artworkStyle")}
                      className={`form-input ${
                        errors.artworkStyle ? "input-error" : ""
                      }`}
                      placeholder="Style artistique (ex: Peinture contemporaine, Photographie, etc.)"
                    />
                  </TranslationField>
                </div>
              </div>
            </div>

            <div className="form-section mt-lg">
              <h2 className="section-title">
                Images supplémentaires (optionnel)
              </h2>
              <div className="d-flex gap-md" style={{ flexWrap: "wrap" }}>
                <div style={{ flex: "1 1 300px", minWidth: "250px" }}>
                  <OptionalImageUpload
                    onFileSelect={setSecondaryImageFile}
                    label="Image secondaire de l'artiste"
                    description="Une photo supplémentaire de l'artiste pour enrichir le profil"
                    previewUrl={
                      deletedSecondaryImage
                        ? null
                        : landingArtist.secondaryImageUrl || null
                    }
                    allowDelete={true}
                    onDelete={handleDeleteSecondaryImage}
                  />
                </div>
                <div style={{ flex: "1 1 300px", minWidth: "250px" }}>
                  <OptionalImageUpload
                    onFileSelect={setStudioImageFile}
                    label="Image de l'atelier"
                    description="Une photo de l'espace de travail ou atelier de l'artiste"
                    previewUrl={
                      deletedStudioImage
                        ? null
                        : landingArtist.imageArtistStudio || null
                    }
                    allowDelete={true}
                    onDelete={handleDeleteStudioImage}
                  />
                </div>
              </div>
            </div>

            <div className="form-section mt-lg">
              <h2 className="section-title">Citations et Biographies</h2>
              <TranslationField
                entityType="LandingArtist"
                entityId={landingArtist.id}
                field="quoteFromInRealArt"
                label="Mots d'InRealArt sur l'artiste"
              >
                <input
                  id="quoteFromInRealArt"
                  type="text"
                  {...register("quoteFromInRealArt")}
                  className="form-input"
                  placeholder="Citation courte affichée sur la page"
                />
              </TranslationField>
              <div className="d-flex gap-md mt-md">
                <div style={{ flex: 1 }}>
                  <TranslationField
                    entityType="LandingArtist"
                    entityId={landingArtist.id}
                    field="biographyHeader1"
                    label="Biographie section 1 - Titre"
                  >
                    <input
                      id="biographyHeader1"
                      type="text"
                      {...register("biographyHeader1")}
                      className="form-input"
                      placeholder="Titre section 1"
                    />
                  </TranslationField>
                </div>
                <div style={{ flex: 1 }}>
                  <TranslationField
                    entityType="LandingArtist"
                    entityId={landingArtist.id}
                    field="biographyText1"
                    label="Biographie section 1 - Texte"
                  >
                    <textarea
                      id="biographyText1"
                      {...register("biographyText1")}
                      className="form-textarea"
                      rows={4}
                      placeholder="Texte section 1"
                    />
                  </TranslationField>
                </div>
              </div>
              <div className="d-flex gap-md mt-md">
                <div style={{ flex: 1 }}>
                  <TranslationField
                    entityType="LandingArtist"
                    entityId={landingArtist.id}
                    field="biographyHeader2"
                    label="Biographie section 2 - Titre"
                  >
                    <input
                      id="biographyHeader2"
                      type="text"
                      {...register("biographyHeader2")}
                      className="form-input"
                      placeholder="Titre section 2"
                    />
                  </TranslationField>
                </div>
                <div style={{ flex: 1 }}>
                  <TranslationField
                    entityType="LandingArtist"
                    entityId={landingArtist.id}
                    field="biographyText2"
                    label="Biographie section 2 - Texte"
                  >
                    <textarea
                      id="biographyText2"
                      {...register("biographyText2")}
                      className="form-textarea"
                      rows={4}
                      placeholder="Texte section 2"
                    />
                  </TranslationField>
                </div>
              </div>
              <div className="d-flex gap-md mt-md">
                <div style={{ flex: 1 }}>
                  <TranslationField
                    entityType="LandingArtist"
                    entityId={landingArtist.id}
                    field="biographyHeader3"
                    label="Biographie section 3 - Titre"
                  >
                    <input
                      id="biographyHeader3"
                      type="text"
                      {...register("biographyHeader3")}
                      className="form-input"
                      placeholder="Titre section 3"
                    />
                  </TranslationField>
                </div>
                <div style={{ flex: 1 }}>
                  <TranslationField
                    entityType="LandingArtist"
                    entityId={landingArtist.id}
                    field="biographyText3"
                    label="Biographie section 3 - Texte"
                  >
                    <textarea
                      id="biographyText3"
                      {...register("biographyText3")}
                      className="form-textarea"
                      rows={4}
                      placeholder="Texte section 3"
                    />
                  </TranslationField>
                </div>
              </div>
              <div className="d-flex gap-md mt-md">
                <div style={{ flex: 1 }}>
                  <TranslationField
                    entityType="LandingArtist"
                    entityId={landingArtist.id}
                    field="biographyHeader4"
                    label="Biographie section 4 - Titre"
                  >
                    <input
                      id="biographyHeader4"
                      type="text"
                      {...register("biographyHeader4")}
                      className="form-input"
                      placeholder="Titre section 4"
                    />
                  </TranslationField>
                </div>
                <div style={{ flex: 1 }}>
                  <TranslationField
                    entityType="LandingArtist"
                    entityId={landingArtist.id}
                    field="biographyText4"
                    label="Biographie section 4 - Texte"
                  >
                    <textarea
                      id="biographyText4"
                      {...register("biographyText4")}
                      className="form-textarea"
                      rows={4}
                      placeholder="Texte section 4"
                    />
                  </TranslationField>
                </div>
              </div>
            </div>

            <div className="form-section mt-lg">
              <h2 className="section-title">Liens de réseaux sociaux</h2>
              <p className="section-subtitle">
                Ajoutez les liens vers les réseaux sociaux et site web de
                l'artiste
              </p>

              <div className="form-group mt-md">
                <label htmlFor="websiteUrl" className="form-label">
                  Site web
                </label>
                <input
                  id="websiteUrl"
                  type="text"
                  {...register("websiteUrl")}
                  className={`form-input ${
                    errors.websiteUrl ? "input-error" : ""
                  }`}
                  placeholder="https://site-web-artiste.com"
                />
                {errors.websiteUrl && (
                  <p className="form-error">{errors.websiteUrl.message}</p>
                )}
              </div>

              <div className="d-flex gap-md mt-md">
                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="facebookUrl" className="form-label">
                    Facebook
                  </label>
                  <input
                    id="facebookUrl"
                    type="text"
                    {...register("facebookUrl")}
                    className={`form-input ${
                      errors.facebookUrl ? "input-error" : ""
                    }`}
                    placeholder="https://facebook.com/username"
                  />
                  {errors.facebookUrl && (
                    <p className="form-error">{errors.facebookUrl.message}</p>
                  )}
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="instagramUrl" className="form-label">
                    Instagram
                  </label>
                  <input
                    id="instagramUrl"
                    type="text"
                    {...register("instagramUrl")}
                    className={`form-input ${
                      errors.instagramUrl ? "input-error" : ""
                    }`}
                    placeholder="https://instagram.com/username"
                  />
                  {errors.instagramUrl && (
                    <p className="form-error">{errors.instagramUrl.message}</p>
                  )}
                </div>
              </div>

              <div className="d-flex gap-md mt-md">
                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="twitterUrl" className="form-label">
                    Twitter
                  </label>
                  <input
                    id="twitterUrl"
                    type="text"
                    {...register("twitterUrl")}
                    className={`form-input ${
                      errors.twitterUrl ? "input-error" : ""
                    }`}
                    placeholder="https://twitter.com/username"
                  />
                  {errors.twitterUrl && (
                    <p className="form-error">{errors.twitterUrl.message}</p>
                  )}
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="linkedinUrl" className="form-label">
                    LinkedIn
                  </label>
                  <input
                    id="linkedinUrl"
                    type="text"
                    {...register("linkedinUrl")}
                    className={`form-input ${
                      errors.linkedinUrl ? "input-error" : ""
                    }`}
                    placeholder="https://linkedin.com/in/username"
                  />
                  {errors.linkedinUrl && (
                    <p className="form-error">{errors.linkedinUrl.message}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="form-section mt-lg">
              <h2 className="section-title">Images des œuvres</h2>
              <p className="section-subtitle">
                Ajoutez les images des œuvres qui seront affichées sur la page
                d'accueil
              </p>

              <div className="form-group mt-md">
                <div className="d-flex gap-md mb-md">
                  <div style={{ flex: 2 }}>
                    <label htmlFor="newImageName" className="form-label">
                      Nom de l'œuvre
                    </label>
                    <input
                      id="newImageName"
                      type="text"
                      value={newImageName}
                      onChange={(e) => setNewImageName(e.target.value)}
                      className="form-input"
                      placeholder="Nom de l'œuvre (optionnel)"
                    />
                  </div>
                  <div style={{ flex: 3 }}>
                    <label htmlFor="newImageUrl" className="form-label">
                      URL de l'image
                    </label>
                    <div className="d-flex gap-sm">
                      <input
                        id="newImageUrl"
                        type="text"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        className="form-input"
                        placeholder="https://example.com/image.jpg"
                      />
                      <button
                        type="button"
                        onClick={handleAddImage}
                        disabled={!newImageUrl}
                        className="btn btn-primary btn-medium"
                        aria-label="Ajouter une image"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                <div
                  className="image-list mt-md"
                  style={{ overflow: "auto", maxWidth: "100%" }}
                >
                  {artworkImages.length === 0 ? (
                    <p className="text-muted">Aucune image ajoutée</p>
                  ) : (
                    <div
                      className="d-flex gap-md"
                      style={{ flexWrap: "nowrap", paddingBottom: "10px" }}
                    >
                      {artworkImages.map((image, index) => (
                        <div
                          key={index}
                          className="image-item"
                          style={{
                            position: "relative",
                            width: "150px",
                            flexShrink: 0,
                          }}
                        >
                          <div
                            style={{
                              position: "relative",
                              width: "150px",
                              height: "150px",
                              borderRadius: "8px",
                              overflow: "hidden",
                            }}
                          >
                            <Image
                              src={image.url}
                              alt={image.name || `Image ${index + 1}`}
                              fill
                              style={{ objectFit: "cover" }}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="btn btn-danger btn-small"
                            style={{
                              position: "absolute",
                              top: "5px",
                              right: "5px",
                              padding: "4px",
                              borderRadius: "50%",
                            }}
                            aria-label="Supprimer l'image"
                          >
                            <X size={16} />
                          </button>
                          {image.name && (
                            <p
                              className="image-name mt-xs"
                              style={{
                                fontSize: "0.9rem",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {image.name}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="card-footer">
            <div className="d-flex justify-content-between">
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-secondary btn-medium"
                disabled={isSubmitting}
              >
                Annuler
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-medium"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Enregistrement..." : "Enregistrer"}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Modal de progression */}
      <ProgressModal
        isOpen={showProgressModal}
        steps={progressSteps}
        currentError={progressError}
        onClose={
          progressError
            ? () => {
                setShowProgressModal(false);
                setProgressError(undefined);
              }
            : undefined
        }
      />
    </div>
  );
}
