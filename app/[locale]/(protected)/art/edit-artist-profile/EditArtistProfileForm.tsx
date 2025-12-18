"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useToast } from "@/app/components/Toast/ToastContext";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  updateUserArtistProfile,
  getLandingArtistByArtistId,
} from "@/lib/actions/artist-actions";
import CountrySelect from "@/app/components/Common/CountrySelect";
import { getCountries } from "@/lib/utils";
import Button from "@/app/components/Button/Button";
import ArtistImageUpload from "../create-artist-profile/ArtistImageUpload";
import OptionalImageUpload from "../create-artist-profile/OptionalImageUpload";
import ProgressModal from "../create-artist-profile/ProgressModal";
import DynamicFormList from "@/app/components/Forms/DynamicFormList/DynamicFormList";
import MultiSelect from "@/app/components/Forms/MultiSelect";
import { Controller } from "react-hook-form";

// Fonction pour créer le schéma de validation avec traductions
const createFormSchema = (t: (key: string) => string) => z.object({
  pseudo: z.string().min(1, t("validation.pseudoRequired")),
  description: z
    .string()
    .min(10, t("validation.descriptionMinLength")),
  artistsPage: z.boolean().default(false),
  birthYear: z
    .number()
    .min(1900, t("validation.birthYearMin"))
    .max(
      new Date().getFullYear(),
      t("validation.birthYearMax")
    )
    .nullable()
    .optional(),
  countryCode: z
    .string()
    .min(2, t("validation.countryCodeMin"))
    .max(3, t("validation.countryCodeMax"))
    .nullable()
    .optional(),
  websiteUrl: z
    .string()
    .url(t("validation.websiteUrlInvalid"))
    .nullable()
    .optional()
    .or(z.literal("")),
  facebookUrl: z
    .string()
    .url(t("validation.facebookUrlInvalid"))
    .nullable()
    .optional()
    .or(z.literal("")),
  instagramUrl: z
    .string()
    .url(t("validation.instagramUrlInvalid"))
    .nullable()
    .optional()
    .or(z.literal("")),
  twitterUrl: z
    .string()
    .url(t("validation.twitterUrlInvalid"))
    .nullable()
    .optional()
    .or(z.literal("")),
  linkedinUrl: z
    .string()
    .url(t("validation.linkedinUrlInvalid"))
    .nullable()
    .optional()
    .or(z.literal("")),
  // Champs d'expositions
  biographyHeader1: z.string().nullable().optional().or(z.literal("")),
  biographyText1: z.string().nullable().optional().or(z.literal("")),
  biographyHeader2: z.string().nullable().optional().or(z.literal("")),
  biographyText2: z.string().nullable().optional().or(z.literal("")),
  biographyHeader3: z.string().nullable().optional().or(z.literal("")),
  biographyText3: z.string().nullable().optional().or(z.literal("")),
  biographyHeader4: z.string().nullable().optional().or(z.literal("")),
  biographyText4: z.string().nullable().optional().or(z.literal("")),
  specialtyIds: z.array(z.number()).optional().default([]),
});

type FormValues = z.infer<ReturnType<typeof createFormSchema>>;

interface EditArtistProfileFormProps {
  artist: {
    id: number;
    name: string;
    surname: string;
    pseudo: string;
    description: string;
    imageUrl: string;
    birthYear: number | null;
    countryCode: string | null;
    websiteUrl: string | null;
    facebookUrl: string | null;
    instagramUrl: string | null;
    twitterUrl: string | null;
    linkedinUrl: string | null;
  };
  landingArtist: {
    id: number;
    artistsPage: boolean | null;
    secondaryImageUrl: string | null;
    imageArtistStudio: string | null;
    biographyHeader1: string | null;
    biographyText1: string | null;
    biographyHeader2: string | null;
    biographyText2: string | null;
    biographyHeader3: string | null;
    biographyText3: string | null;
    biographyHeader4: string | null;
    biographyText4: string | null;
  } | null;
  awards?: Array<{
    id?: number;
    name: string;
    description: string | null;
    year: number | null;
  }>;
  specialtyIds?: number[];
  allSpecialties?: Array<{
    id: number;
    name: string;
  }>;
}

export default function EditArtistProfileForm({
  artist,
  landingArtist,
  awards = [],
  specialtyIds = [],
  allSpecialties = [],
}: EditArtistProfileFormProps) {
  const router = useRouter();
  const t = useTranslations("art.editArtistProfileForm");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [secondaryImageFile, setSecondaryImageFile] = useState<File | null>(
    null
  );
  const [studioImageFile, setStudioImageFile] = useState<File | null>(null);
  const [awardsList, setAwardsList] = useState<
    Array<{ name: string; description?: string; year?: number; order?: number }>
  >(
    awards.map((award, index) => ({
      name: award.name,
      description: award.description || "",
      year: award.year || undefined,
      order: index,
    }))
  );
  // États pour marquer les images à supprimer
  const [shouldDeleteMainImage, setShouldDeleteMainImage] = useState(false);
  const [shouldDeleteSecondaryImage, setShouldDeleteSecondaryImage] =
    useState(false);
  const [shouldDeleteStudioImage, setShouldDeleteStudioImage] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressSteps, setProgressSteps] = useState<
    Array<{
      id: string;
      label: string;
      status: "pending" | "in-progress" | "completed" | "error";
    }>
  >([]);
  const [progressError, setProgressError] = useState<string | undefined>(
    undefined
  );
  const { success, error: errorToast } = useToast();

  // Initialiser les étapes de progression avec les traductions
  useEffect(() => {
    setProgressSteps([
      { id: "validation", label: t("progress.validation"), status: "pending" },
      {
        id: "conversion",
        label: t("progress.conversion"),
        status: "pending",
      },
      { id: "upload", label: t("progress.upload"), status: "pending" },
      { id: "update", label: t("progress.update"), status: "pending" },
      { id: "finalization", label: t("progress.finalization"), status: "pending" },
    ]);
  }, [t]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    getValues,
    reset,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(createFormSchema(t)),
    defaultValues: {
      pseudo: artist.pseudo,
      description: artist.description,
      artistsPage: landingArtist?.artistsPage || false,
      birthYear: artist.birthYear ?? null,
      countryCode: artist.countryCode ?? null,
      websiteUrl: artist.websiteUrl || "",
      facebookUrl: artist.facebookUrl || "",
      instagramUrl: artist.instagramUrl || "",
      twitterUrl: artist.twitterUrl || "",
      linkedinUrl: artist.linkedinUrl || "",
      biographyHeader1: landingArtist?.biographyHeader1 || "",
      biographyText1: landingArtist?.biographyText1 || "",
      biographyHeader2: landingArtist?.biographyHeader2 || "",
      biographyText2: landingArtist?.biographyText2 || "",
      biographyHeader3: landingArtist?.biographyHeader3 || "",
      biographyText3: landingArtist?.biographyText3 || "",
      biographyHeader4: landingArtist?.biographyHeader4 || "",
      biographyText4: landingArtist?.biographyText4 || "",
      specialtyIds: specialtyIds,
    },
  });

  const countryCode = watch("countryCode");
  const artistsPage = watch("artistsPage");

  // Forcer la mise à jour des valeurs birthYear et countryCode après le montage
  useEffect(() => {
    reset({
      pseudo: artist.pseudo,
      description: artist.description,
      artistsPage: landingArtist?.artistsPage || false,
      birthYear: artist.birthYear ?? null,
      countryCode: artist.countryCode ?? null,
      websiteUrl: artist.websiteUrl || "",
      facebookUrl: artist.facebookUrl || "",
      instagramUrl: artist.instagramUrl || "",
      twitterUrl: artist.twitterUrl || "",
      linkedinUrl: artist.linkedinUrl || "",
      biographyHeader1: landingArtist?.biographyHeader1 || "",
      biographyText1: landingArtist?.biographyText1 || "",
      biographyHeader2: landingArtist?.biographyHeader2 || "",
      biographyText2: landingArtist?.biographyText2 || "",
      biographyHeader3: landingArtist?.biographyHeader3 || "",
      biographyText3: landingArtist?.biographyText3 || "",
      biographyHeader4: landingArtist?.biographyHeader4 || "",
      biographyText4: landingArtist?.biographyText4 || "",
    });
  }, [artist, landingArtist, reset]);

  const updateStepStatus = (
    stepId: string,
    status: "pending" | "in-progress" | "completed" | "error"
  ) => {
    setProgressSteps((prev) =>
      prev.map((step) => (step.id === stepId ? { ...step, status } : step))
    );
  };

  // Fonction d'upload côté client pour les images d'artiste
  const handleUpload = async (
    imageFile: File,
    name: string,
    surname: string,
    imageType: "profile" | "secondary" | "studio" = "profile"
  ): Promise<string> => {
    try {
      const { getAuth, signInAnonymously } = await import("firebase/auth");
      const { app } = await import("@/lib/firebase/config");
      const { ref, uploadBytes, getDownloadURL } = await import(
        "firebase/storage"
      );
      const { storage } = await import("@/lib/firebase/config");
      const { convertToWebPIfNeeded } = await import(
        "@/lib/utils/webp-converter"
      );

      const auth = getAuth(app);
      await signInAnonymously(auth);

      updateStepStatus("conversion", "in-progress");
      const conversionResult = await convertToWebPIfNeeded(imageFile);

      if (!conversionResult.success) {
        updateStepStatus("conversion", "error");
        throw new Error(
          conversionResult.error ||
            t("errors.webpConversion")
        );
      }

      updateStepStatus("conversion", "completed");

      updateStepStatus("upload", "in-progress");
      const folderName = `${name} ${surname}`.trim();
      const fileExtension = "webp";

      let fileName = `${name} ${surname}`;
      if (imageType === "secondary") {
        fileName = `${name} ${surname}_secondary`;
      } else if (imageType === "studio") {
        fileName = `${name} ${surname}_studio`;
      }

      const storagePath = `artists/${folderName}/${fileName}.${fileExtension}`;
      const storageRef = ref(storage, storagePath);

      await uploadBytes(storageRef, conversionResult.file);
      const imageUrl = await getDownloadURL(storageRef);

      updateStepStatus("upload", "completed");

      return imageUrl;
    } catch (error) {
      console.error("Erreur lors de l'upload:", error);
      throw error;
    }
  };

  const onSubmit = async (data: FormValues) => {
    setFormError(null);
    setIsSubmitting(true);
    setShowProgressModal(true);
    setProgressError(undefined);

    setProgressSteps([
      { id: "validation", label: t("progress.validation"), status: "pending" },
      {
        id: "conversion",
        label: t("progress.conversion"),
        status: "pending",
      },
      { id: "upload", label: t("progress.upload"), status: "pending" },
      {
        id: "update",
        label: t("progress.update"),
        status: "pending",
      },
      { id: "finalization", label: t("progress.finalization"), status: "pending" },
    ]);

    try {
      updateStepStatus("validation", "in-progress");

      // Vérifier que si l'image principale est supprimée, une nouvelle est fournie
      if (shouldDeleteMainImage && !selectedImageFile) {
        updateStepStatus("validation", "error");
        setProgressError(
          t("errors.mainImageRequired")
        );
        setFormError(
          t("errors.mainImageRequired")
        );
        errorToast(
          t("errors.mainImageRequired")
        );
        setIsSubmitting(false);
        return;
      }

      // Gérer les images : nouvelle upload, suppression, ou conservation
      let imageUrl: string = artist.imageUrl;
      let secondaryImageUrl: string | null =
        landingArtist?.secondaryImageUrl || null;
      let studioImageUrl: string | null =
        landingArtist?.imageArtistStudio || null;

      // Marquer les images à supprimer
      const shouldDeleteMain = shouldDeleteMainImage && !selectedImageFile;
      const shouldDeleteSecondary =
        shouldDeleteSecondaryImage && !secondaryImageFile;
      const shouldDeleteStudio = shouldDeleteStudioImage && !studioImageFile;

      // Upload de la nouvelle image principale si fournie
      if (selectedImageFile) {
        try {
          imageUrl = await handleUpload(
            selectedImageFile,
            artist.name,
            artist.surname,
            "profile"
          );
        } catch (uploadError: any) {
          const errorMessage =
            uploadError?.message || t("errors.upload");
          if (
            errorMessage.toLowerCase().includes("conversion") ||
            errorMessage.toLowerCase().includes("webp")
          ) {
            updateStepStatus("conversion", "error");
          } else {
            updateStepStatus("upload", "error");
          }
          setProgressError(errorMessage);
          errorToast(errorMessage);
          setFormError(t("errors.updateError"));
          setIsSubmitting(false);
          return;
        }
      }

      // Upload de l'image secondaire si fournie
      if (secondaryImageFile) {
        try {
          secondaryImageUrl = await handleUpload(
            secondaryImageFile,
            artist.name,
            artist.surname,
            "secondary"
          );
        } catch (err) {
          console.warn("Erreur lors de l'upload de l'image secondaire:", err);
        }
      }

      // Upload de l'image du studio si fournie
      if (studioImageFile) {
        try {
          studioImageUrl = await handleUpload(
            studioImageFile,
            artist.name,
            artist.surname,
            "studio"
          );
        } catch (err) {
          console.warn("Erreur lors de l'upload de l'image du studio:", err);
        }
      }

      updateStepStatus("validation", "completed");

      // Supprimer les images Firebase si nécessaire (côté client)
      try {
        const { deleteImageFromFirebase } = await import('@/lib/firebase/storage')

        // Supprimer l'image principale si demandé
        if (shouldDeleteMain && artist.imageUrl) {
          try {
            await deleteImageFromFirebase(artist.imageUrl)
            console.log('Image principale Firebase supprimée avec succès')
          } catch (error) {
            console.warn('Erreur lors de la suppression de l\'image principale Firebase (non bloquant):', error)
          }
        }

        // Supprimer l'image secondaire si demandé
        if (shouldDeleteSecondary && landingArtist?.secondaryImageUrl) {
          try {
            await deleteImageFromFirebase(landingArtist.secondaryImageUrl)
            console.log('Image secondaire Firebase supprimée avec succès')
          } catch (error) {
            console.warn('Erreur lors de la suppression de l\'image secondaire Firebase (non bloquant):', error)
          }
        }

        // Supprimer l'image studio si demandé
        if (shouldDeleteStudio && landingArtist?.imageArtistStudio) {
          try {
            await deleteImageFromFirebase(landingArtist.imageArtistStudio)
            console.log('Image studio Firebase supprimée avec succès')
          } catch (error) {
            console.warn('Erreur lors de la suppression de l\'image studio Firebase (non bloquant):', error)
          }
        }
      } catch (error) {
        console.warn('Erreur lors de l\'import de deleteImageFromFirebase (non bloquant):', error)
      }

      // Mise à jour du profil
      updateStepStatus("update", "in-progress");

      const formData = new FormData();
      formData.append("artistId", artist.id.toString());
      formData.append("imageUrl", imageUrl);
      formData.append("pseudo", data.pseudo);
      formData.append("description", data.description);
      formData.append("artistsPage", data.artistsPage.toString());

      // Gérer les images secondaires et studio
      if (shouldDeleteSecondary) {
        formData.append("deleteSecondaryImage", "true");
      } else if (secondaryImageUrl) {
        formData.append("secondaryImageUrl", secondaryImageUrl);
      }

      if (shouldDeleteStudio) {
        formData.append("deleteStudioImage", "true");
      } else if (studioImageUrl) {
        formData.append("imageArtistStudio", studioImageUrl);
      }

      if (shouldDeleteMain) {
        formData.append("deleteMainImage", "true");
      }

      // Gérer birthYear et countryCode (peuvent être null)
      if (data.birthYear !== null && data.birthYear !== undefined) {
        formData.append("birthYear", data.birthYear.toString());
      } else {
        formData.append("birthYear", "");
      }
      if (data.countryCode) {
        formData.append("countryCode", data.countryCode);
      } else {
        formData.append("countryCode", "");
      }
      if (data.websiteUrl) {
        formData.append("websiteUrl", data.websiteUrl);
      }
      if (data.facebookUrl) {
        formData.append("facebookUrl", data.facebookUrl);
      }
      if (data.instagramUrl) {
        formData.append("instagramUrl", data.instagramUrl);
      }
      if (data.twitterUrl) {
        formData.append("twitterUrl", data.twitterUrl);
      }
      if (data.linkedinUrl) {
        formData.append("linkedinUrl", data.linkedinUrl);
      }

      // Champs d'expositions
      if (data.biographyHeader1) {
        formData.append("biographyHeader1", data.biographyHeader1);
      }
      if (data.biographyText1) {
        formData.append("biographyText1", data.biographyText1);
      }
      if (data.biographyHeader2) {
        formData.append("biographyHeader2", data.biographyHeader2);
      }
      if (data.biographyText2) {
        formData.append("biographyText2", data.biographyText2);
      }
      if (data.biographyHeader3) {
        formData.append("biographyHeader3", data.biographyHeader3);
      }
      if (data.biographyText3) {
        formData.append("biographyText3", data.biographyText3);
      }
      if (data.biographyHeader4) {
        formData.append("biographyHeader4", data.biographyHeader4);
      }
      if (data.biographyText4) {
        formData.append("biographyText4", data.biographyText4);
      }

      // Ajouter les récompenses
      formData.append("awards", JSON.stringify(awardsList));

      // Ajouter les spécialités
      formData.append("specialtyIds", JSON.stringify(data.specialtyIds || []));

      const result = await updateUserArtistProfile(formData);

      updateStepStatus("update", "completed");

      if (result.success) {
        updateStepStatus("finalization", "in-progress");
        await new Promise((resolve) => setTimeout(resolve, 500));
        updateStepStatus("finalization", "completed");

        success(t("success.updated"));

        setTimeout(() => {
          setShowProgressModal(false);
          router.push("/dashboard");
          router.refresh();
        }, 1000);
      } else {
        updateStepStatus("update", "error");
        setProgressError(result.message || t("errors.updateError"));
        errorToast(result.message || t("errors.updateError"));
        setFormError(
          result.message || t("errors.updateFailed")
        );
        setIsSubmitting(false);
      }
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour du profil artiste:", error);
      const errorMessage =
        error?.message ||
        t("errors.updateProfileError");

      updateStepStatus("update", "error");

      setProgressError(errorMessage);
      errorToast(errorMessage);
      setFormError(t("errors.updateError"));
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="pl-6 sm:pl-8 md:pl-10">
        {formError && (
          <div className="alert alert-danger mb-4">
            <p>{formError}</p>
          </div>
        )}

        {/* Section Informations de base */}
        <div className="form-group mb-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {t("sections.basicInfo")}
            </h3>
          </div>
          <div className="d-flex gap-lg align-items-start">
            <div style={{ width: "200px", flexShrink: 0 }}>
              <ArtistImageUpload
                onFileSelect={(file) => {
                  setSelectedImageFile(file);
                  setShouldDeleteMainImage(false);
                }}
                onDelete={() => {
                  setSelectedImageFile(null);
                  // Si une image existante était affichée, la marquer pour suppression
                  if (artist.imageUrl && !selectedImageFile) {
                    setShouldDeleteMainImage(true);
                  } else {
                    setShouldDeleteMainImage(false);
                  }
                }}
                previewUrl={shouldDeleteMainImage ? null : artist.imageUrl}
                allowDelete={true}
              />
            </div>

            <div style={{ flex: 1 }}>
              <div className="d-flex gap-md mb-3">
                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="name" className="form-label">
                    {t("fields.firstName")}
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={artist.name}
                    readOnly
                    className="form-input"
                    style={{
                      backgroundColor: "#f5f5f5",
                      cursor: "not-allowed",
                    }}
                  />
                  <p
                    className="form-help text-muted mt-1"
                    style={{ fontSize: "0.875rem" }}
                  >
                    {t("fields.firstNameHelp")}
                  </p>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="surname" className="form-label">
                    {t("fields.lastName")}
                  </label>
                  <input
                    id="surname"
                    type="text"
                    value={artist.surname}
                    readOnly
                    className="form-input"
                    style={{
                      backgroundColor: "#f5f5f5",
                      cursor: "not-allowed",
                    }}
                  />
                  <p
                    className="form-help text-muted mt-1"
                    style={{ fontSize: "0.875rem" }}
                  >
                    {t("fields.lastNameHelp")}
                  </p>
                </div>
              </div>

              <div className="form-group mb-3">
                <label htmlFor="pseudo" className="form-label">
                  {t("fields.pseudo")} *
                </label>
                <input
                  id="pseudo"
                  type="text"
                  {...register("pseudo")}
                  className={`form-input ${errors.pseudo ? "input-error" : ""}`}
                />
                {errors.pseudo && (
                  <p className="form-error">{errors.pseudo.message}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section Images supplémentaires */}
        <div className="form-group mb-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {t("sections.additionalImages")}
            </h3>
          </div>
          <div className="d-flex gap-md" style={{ flexWrap: "wrap" }}>
            <div style={{ flex: "1 1 300px", minWidth: "250px" }}>
              <OptionalImageUpload
                onFileSelect={(file) => {
                  setSecondaryImageFile(file);
                  setShouldDeleteSecondaryImage(false);
                }}
                onDelete={() => {
                  setSecondaryImageFile(null);
                  // Si une image existante était affichée, la marquer pour suppression
                  if (landingArtist?.secondaryImageUrl && !secondaryImageFile) {
                    setShouldDeleteSecondaryImage(true);
                  } else {
                    setShouldDeleteSecondaryImage(false);
                  }
                }}
                label={t("fields.secondaryImageLabel")}
                description={t("fields.secondaryImageDescription")}
                previewUrl={
                  shouldDeleteSecondaryImage
                    ? null
                    : landingArtist?.secondaryImageUrl || null
                }
                allowDelete={true}
              />
            </div>
            <div style={{ flex: "1 1 300px", minWidth: "250px" }}>
              <OptionalImageUpload
                onFileSelect={(file) => {
                  setStudioImageFile(file);
                  setShouldDeleteStudioImage(false);
                }}
                onDelete={() => {
                  setStudioImageFile(null);
                  // Si une image existante était affichée, la marquer pour suppression
                  if (landingArtist?.imageArtistStudio && !studioImageFile) {
                    setShouldDeleteStudioImage(true);
                  } else {
                    setShouldDeleteStudioImage(false);
                  }
                }}
                label={t("fields.studioImageLabel")}
                description={t("fields.studioImageDescription")}
                previewUrl={
                  shouldDeleteStudioImage
                    ? null
                    : landingArtist?.imageArtistStudio || null
                }
                allowDelete={true}
              />
            </div>
          </div>
        </div>

        <div className="form-group mb-4">
          <label htmlFor="description" className="form-label">
            {t("fields.description")} *
          </label>
          <textarea
            id="description"
            {...register("description")}
            className={`form-textarea ${
              errors.description ? "input-error" : ""
            }`}
            rows={5}
            placeholder={t("fields.descriptionPlaceholder")}
          />
          {errors.description && (
            <p className="form-error">{errors.description.message}</p>
          )}
          <p className="form-help text-muted mt-1">
            {t("fields.descriptionHelp")}
          </p>
        </div>

        <div className="form-group mb-4">
          <label className="form-label">{t("fields.artistsPage")}</label>
          <div className="d-flex align-items-center gap-md">
            <span
              className={!artistsPage ? "text-primary" : "text-muted"}
              style={{ fontWeight: !artistsPage ? "bold" : "normal" }}
            >
              {t("fields.artistsPageNotDisplayed")}
            </span>
            <label
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
              style={{ fontWeight: artistsPage ? "bold" : "normal" }}
            >
              {t("fields.artistsPageDisplayed")}
            </span>
          </div>
          <p className="form-help text-muted mt-1">
            {t("fields.artistsPageHelp")}
          </p>
        </div>

        <div className="d-flex gap-md mb-4">
          <div className="form-group" style={{ flex: 1 }}>
            <label htmlFor="birthYear" className="form-label">
              {t("fields.birthYear")}
            </label>
            <input
              key={`birthYear-${artist.birthYear || "empty"}`}
              id="birthYear"
              type="number"
              {...register("birthYear", {
                valueAsNumber: true,
                setValueAs: (value) => (value === "" ? null : Number(value)),
              })}
              className={`form-input ${errors.birthYear ? "input-error" : ""}`}
              placeholder={t("fields.birthYearPlaceholder")}
              min="1900"
              max={new Date().getFullYear()}
            />
            {errors.birthYear && (
              <p className="form-error">{errors.birthYear.message}</p>
            )}
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label htmlFor="countryCode" className="form-label">
              {t("fields.country")}
            </label>
            <CountrySelect
              key={`country-${artist.countryCode || "empty"}`}
              countries={getCountries()}
              value={countryCode || artist.countryCode || ""}
              onChange={(code) => setValue("countryCode", code)}
              placeholder={t("fields.countryPlaceholder")}
            />
            {errors.countryCode && (
              <p className="form-error">{errors.countryCode.message}</p>
            )}
          </div>
        </div>

        {/* Section Spécialités */}
        <div className="form-group mb-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {t("sections.specialties")}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {t("fields.specialtiesHelp")}
            </p>
          </div>
          <Controller
            name="specialtyIds"
            control={control}
            render={({ field }) => (
              <MultiSelect
                label={t("fields.specialties")}
                options={allSpecialties.map((specialty) => ({
                  id: specialty.id,
                  name: specialty.name,
                }))}
                value={field.value || []}
                onChange={field.onChange}
                placeholder={t("fields.specialtiesPlaceholder")}
                error={errors.specialtyIds?.message as string}
              />
            )}
          />
        </div>

        {/* Section Récompenses */}
        <div className="form-group mb-4">
          <DynamicFormList
            title={t("sections.awards")}
            description={t("fields.awardsDescription")}
            fields={[
              {
                name: "name",
                label: t("fields.awardName"),
                type: "text",
                placeholder: t("fields.awardNamePlaceholder"),
                required: true,
                colSpan: 2,
              },
              {
                name: "year",
                label: t("fields.awardYear"),
                type: "number",
                placeholder: t("fields.awardYearPlaceholder"),
                required: false,
                colSpan: 1,
                validation: (value) => {
                  if (value === null || value === undefined || value === "")
                    return true;
                  const year =
                    typeof value === "number" ? value : parseInt(value);
                  if (isNaN(year)) return t("validation.yearInvalid");
                  if (year < 1900) return t("validation.yearMin");
                  if (year > new Date().getFullYear())
                    return t("validation.yearMax");
                  return true;
                },
              },
              {
                name: "description",
                label: t("fields.awardDescription"),
                type: "textarea",
                placeholder: t("fields.awardDescriptionPlaceholder"),
                required: false,
                colSpan: 3,
              },
            ]}
            items={awardsList}
            onItemsChange={setAwardsList}
            register={register}
            errors={errors}
            setValue={setValue}
            getValues={getValues}
            maxItems={3}
            minItems={0}
            itemLabel={(item, index) =>
              t("fields.awardItemLabel", { index: index + 1 }) + (item.name ? ` - ${item.name}` : "")
            }
          />
        </div>

        {/* Section Expositions */}
        <div className="form-group mb-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {t("sections.exhibitions")}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              {t("fields.exhibitionsDescription")}
            </p>
          </div>

          {[
            {
              num: 1,
              headerKey: "biographyHeader1" as const,
              textKey: "biographyText1" as const,
            },
            {
              num: 2,
              headerKey: "biographyHeader2" as const,
              textKey: "biographyText2" as const,
            },
            {
              num: 3,
              headerKey: "biographyHeader3" as const,
              textKey: "biographyText3" as const,
            },
            {
              num: 4,
              headerKey: "biographyHeader4" as const,
              textKey: "biographyText4" as const,
            },
          ].map(({ num, headerKey, textKey }) => (
            <div
              key={num}
              className="mb-4"
              style={{
                padding: "1.5rem",
                border: "1px solid #e0e0e0",
                borderRadius: "8px",
                backgroundColor: "#fafafa",
              }}
            >
              <h4
                className="h6 mb-3"
                style={{ color: "#666", fontWeight: 600 }}
              >
                {t("fields.exhibition", { num })}
              </h4>
              <div className="form-group mb-3">
                <label htmlFor={headerKey} className="form-label">
                  {t("fields.exhibitionTitle", { num })}
                </label>
                <input
                  id={headerKey}
                  type="text"
                  {...register(headerKey)}
                  className="form-input"
                  placeholder={t("fields.exhibitionTitlePlaceholder")}
                />
              </div>
              <div className="form-group">
                <label htmlFor={textKey} className="form-label">
                  {t("fields.exhibitionDescription", { num })}
                </label>
                <textarea
                  id={textKey}
                  {...register(textKey)}
                  className="form-textarea"
                  rows={4}
                  placeholder={t("fields.exhibitionDescriptionPlaceholder")}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="form-group mb-4">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {t("sections.socialNetworks")}
            </h3>
          </div>
          <div className="form-group mb-3">
            <label htmlFor="websiteUrl" className="form-label">
              {t("fields.website")}
            </label>
            <input
              id="websiteUrl"
              type="url"
              {...register("websiteUrl")}
              className={`form-input ${errors.websiteUrl ? "input-error" : ""}`}
              placeholder={t("fields.websitePlaceholder")}
            />
            {errors.websiteUrl && (
              <p className="form-error">{errors.websiteUrl.message}</p>
            )}
          </div>

          <div className="d-flex gap-md">
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="facebookUrl" className="form-label">
                {t("fields.facebook")}
              </label>
              <input
                id="facebookUrl"
                type="url"
                {...register("facebookUrl")}
                className={`form-input ${
                  errors.facebookUrl ? "input-error" : ""
                }`}
                placeholder={t("fields.facebookPlaceholder")}
              />
              {errors.facebookUrl && (
                <p className="form-error">{errors.facebookUrl.message}</p>
              )}
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="instagramUrl" className="form-label">
                {t("fields.instagram")}
              </label>
              <input
                id="instagramUrl"
                type="url"
                {...register("instagramUrl")}
                className={`form-input ${
                  errors.instagramUrl ? "input-error" : ""
                }`}
                placeholder={t("fields.instagramPlaceholder")}
              />
              {errors.instagramUrl && (
                <p className="form-error">{errors.instagramUrl.message}</p>
              )}
            </div>
          </div>

          <div className="d-flex gap-md mt-3">
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="twitterUrl" className="form-label">
                {t("fields.twitter")}
              </label>
              <input
                id="twitterUrl"
                type="url"
                {...register("twitterUrl")}
                className={`form-input ${
                  errors.twitterUrl ? "input-error" : ""
                }`}
                placeholder={t("fields.twitterPlaceholder")}
              />
              {errors.twitterUrl && (
                <p className="form-error">{errors.twitterUrl.message}</p>
              )}
            </div>
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="linkedinUrl" className="form-label">
                {t("fields.linkedin")}
              </label>
              <input
                id="linkedinUrl"
                type="url"
                {...register("linkedinUrl")}
                className={`form-input ${
                  errors.linkedinUrl ? "input-error" : ""
                }`}
                placeholder={t("fields.linkedinPlaceholder")}
              />
              {errors.linkedinUrl && (
                <p className="form-error">{errors.linkedinUrl.message}</p>
              )}
            </div>
          </div>
        </div>

        <div className="form-actions mt-4 d-flex justify-content-between gap-md">
          <Button
            variant="secondary"
            onClick={() => router.push("/dashboard")}
            disabled={isSubmitting}
            type="button"
          >
            {t("buttons.cancel")}
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isSubmitting}
            isLoading={isSubmitting}
            loadingText={t("buttons.updating")}
          >
            {t("buttons.update")}
          </Button>
        </div>
      </form>

      {/* Modal de progression */}
      <ProgressModal
        isOpen={showProgressModal}
        steps={progressSteps}
        currentError={progressError}
      />
    </>
  );
}
