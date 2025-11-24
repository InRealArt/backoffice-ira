"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/components/Toast/ToastContext";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateUserArtistProfile, getLandingArtistByArtistId } from "@/lib/actions/artist-actions";
import CountrySelect from "@/app/components/Common/CountrySelect";
import { getCountries } from "@/lib/utils";
import Button from "@/app/components/Button/Button";
import ArtistImageUpload from "../create-artist-profile/ArtistImageUpload";
import OptionalImageUpload from "../create-artist-profile/OptionalImageUpload";
import ProgressModal from "../create-artist-profile/ProgressModal";

// Schéma de validation pour l'édition
const formSchema = z.object({
  pseudo: z.string().min(1, "Le pseudo est requis"),
  description: z
    .string()
    .min(10, "La description doit contenir au moins 10 caractères"),
  artistsPage: z.boolean().default(false),
  birthYear: z
    .number()
    .min(1900, "L'année de naissance doit être supérieure à 1900")
    .max(
      new Date().getFullYear(),
      "L'année de naissance ne peut pas être dans le futur"
    )
    .nullable()
    .optional(),
  countryCode: z
    .string()
    .min(2, "Le code pays doit contenir au moins 2 caractères")
    .max(3, "Le code pays ne peut pas dépasser 3 caractères")
    .nullable()
    .optional(),
  websiteUrl: z
    .string()
    .url("URL de site web invalide")
    .nullable()
    .optional()
    .or(z.literal("")),
  facebookUrl: z
    .string()
    .url("URL Facebook invalide")
    .nullable()
    .optional()
    .or(z.literal("")),
  instagramUrl: z
    .string()
    .url("URL Instagram invalide")
    .nullable()
    .optional()
    .or(z.literal("")),
  twitterUrl: z
    .string()
    .url("URL Twitter invalide")
    .nullable()
    .optional()
    .or(z.literal("")),
  linkedinUrl: z
    .string()
    .url("URL LinkedIn invalide")
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
});

type FormValues = z.infer<typeof formSchema>;

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
}

export default function EditArtistProfileForm({
  artist,
  landingArtist,
}: EditArtistProfileFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [secondaryImageFile, setSecondaryImageFile] = useState<File | null>(
    null
  );
  const [studioImageFile, setStudioImageFile] = useState<File | null>(null);
  // États pour marquer les images à supprimer
  const [shouldDeleteMainImage, setShouldDeleteMainImage] = useState(false);
  const [shouldDeleteSecondaryImage, setShouldDeleteSecondaryImage] = useState(false);
  const [shouldDeleteStudioImage, setShouldDeleteStudioImage] = useState(false);
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
    { id: "update", label: "Mise à jour du profil artiste", status: "pending" },
    { id: "finalization", label: "Finalisation", status: "pending" },
  ]);
  const [progressError, setProgressError] = useState<string | undefined>(
    undefined
  );
  const { success, error: errorToast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
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
      const { normalizeString } = await import("@/lib/utils");

      const auth = getAuth(app);
      await signInAnonymously(auth);

      updateStepStatus("conversion", "in-progress");
      const conversionResult = await convertToWebPIfNeeded(imageFile);

      if (!conversionResult.success) {
        updateStepStatus("conversion", "error");
        throw new Error(
          conversionResult.error ||
            "Erreur lors de la conversion de l'image en WebP"
        );
      }

      updateStepStatus("conversion", "completed");

      updateStepStatus("upload", "in-progress");
      const fileName = normalizeString(`${name} ${surname}`);
      const fileExtension = "webp";

      let filePrefix = `${name} ${surname}`;
      if (imageType === "secondary") {
        filePrefix = `${name} ${surname}_2`;
      } else if (imageType === "studio") {
        filePrefix = `${name} ${surname}_studio`;
      }

      const storagePath = `artists/${fileName}/${filePrefix}.${fileExtension}`;
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
      { id: "validation", label: "Validation des données", status: "pending" },
      {
        id: "conversion",
        label: "Conversion de l'image en WebP",
        status: "pending",
      },
      { id: "upload", label: "Upload vers Firebase", status: "pending" },
      {
        id: "update",
        label: "Mise à jour du profil artiste",
        status: "pending",
      },
      { id: "finalization", label: "Finalisation", status: "pending" },
    ]);

    try {
      updateStepStatus("validation", "in-progress");

      // Vérifier que si l'image principale est supprimée, une nouvelle est fournie
      if (shouldDeleteMainImage && !selectedImageFile) {
        updateStepStatus("validation", "error");
        setProgressError("Vous devez fournir une nouvelle photo de profil si vous supprimez l'actuelle");
        setFormError("Vous devez fournir une nouvelle photo de profil si vous supprimez l'actuelle");
        errorToast("Vous devez fournir une nouvelle photo de profil si vous supprimez l'actuelle");
        setIsSubmitting(false);
        return;
      }

      // Gérer les images : nouvelle upload, suppression, ou conservation
      let imageUrl: string = artist.imageUrl;
      let secondaryImageUrl: string | null = landingArtist?.secondaryImageUrl || null;
      let studioImageUrl: string | null = landingArtist?.imageArtistStudio || null;
      
      // Marquer les images à supprimer
      const shouldDeleteMain = shouldDeleteMainImage && !selectedImageFile;
      const shouldDeleteSecondary = shouldDeleteSecondaryImage && !secondaryImageFile;
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
            uploadError?.message || "Erreur lors de l'upload";
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
          setFormError("Une erreur est survenue");
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

      const result = await updateUserArtistProfile(formData);

      updateStepStatus("update", "completed");

      if (result.success) {
        updateStepStatus("finalization", "in-progress");
        await new Promise((resolve) => setTimeout(resolve, 500));
        updateStepStatus("finalization", "completed");

        success("Profil artiste mis à jour avec succès");

        setTimeout(() => {
          setShowProgressModal(false);
          router.push("/dashboard");
          router.refresh();
        }, 1000);
      } else {
        updateStepStatus("update", "error");
        setProgressError(result.message || "Une erreur est survenue");
        errorToast(result.message || "Une erreur est survenue");
        setFormError(
          result.message || "Échec de la mise à jour du profil artiste"
        );
        setIsSubmitting(false);
      }
    } catch (error: any) {
      console.error("Erreur lors de la mise à jour du profil artiste:", error);
      const errorMessage =
        error?.message ||
        "Une erreur est survenue lors de la mise à jour du profil artiste";

      updateStepStatus("update", "error");

      setProgressError(errorMessage);
      errorToast(errorMessage);
      setFormError("Une erreur est survenue");
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)}>
        {formError && (
          <div className="alert alert-danger mb-4">
            <p>{formError}</p>
          </div>
        )}

        {/* Section Informations de base */}
        <div className="form-group mb-4">
          <h3
            className="h5 mb-3"
            style={{
              borderBottom: "2px solid #e0e0e0",
              paddingBottom: "0.5rem",
            }}
          >
            Informations de base
          </h3>
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
                    Prénom
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
                  <p className="form-help text-muted mt-1" style={{ fontSize: "0.875rem" }}>
                    Le prénom ne peut pas être modifié
                  </p>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="surname" className="form-label">
                    Nom
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
                  <p className="form-help text-muted mt-1" style={{ fontSize: "0.875rem" }}>
                    Le nom ne peut pas être modifié
                  </p>
                </div>
              </div>

              <div className="form-group mb-3">
                <label htmlFor="pseudo" className="form-label">
                  Pseudo *
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
          <h3
            className="h5 mb-3"
            style={{
              borderBottom: "2px solid #e0e0e0",
              paddingBottom: "0.5rem",
            }}
          >
            Images supplémentaires (optionnel)
          </h3>
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
                label="Image secondaire de l'artiste"
                description="Une photo supplémentaire de vous pour enrichir votre profil"
                previewUrl={shouldDeleteSecondaryImage ? null : (landingArtist?.secondaryImageUrl || null)}
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
                label="Image de votre studio"
                description="Une photo de votre espace de travail ou atelier"
                previewUrl={shouldDeleteStudioImage ? null : (landingArtist?.imageArtistStudio || null)}
                allowDelete={true}
              />
            </div>
          </div>
        </div>

        <div className="form-group mb-4">
          <label htmlFor="description" className="form-label">
            Description *
          </label>
          <textarea
            id="description"
            {...register("description")}
            className={`form-textarea ${
              errors.description ? "input-error" : ""
            }`}
            rows={5}
            placeholder="Décrivez votre parcours artistique, votre style, vos influences..."
          />
          {errors.description && (
            <p className="form-error">{errors.description.message}</p>
          )}
          <p className="form-help text-muted mt-1">
            Cette description sera utilisée pour votre profil artiste et votre
            page de présentation.
          </p>
        </div>

        <div className="form-group mb-4">
          <label className="form-label">Affichage sur la page d'accueil</label>
          <div className="d-flex align-items-center gap-md">
            <span
              className={!artistsPage ? "text-primary" : "text-muted"}
              style={{ fontWeight: !artistsPage ? "bold" : "normal" }}
            >
              Non affiché
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
              Affiché
            </span>
          </div>
          <p className="form-help text-muted mt-1">
            Activez cette option pour afficher votre profil sur la page
            d'accueil du site.
          </p>
        </div>

        <div className="d-flex gap-md mb-4">
          <div className="form-group" style={{ flex: 1 }}>
            <label htmlFor="birthYear" className="form-label">
              Année de naissance
            </label>
            <input
              key={`birthYear-${artist.birthYear || 'empty'}`}
              id="birthYear"
              type="number"
              {...register("birthYear", { 
                valueAsNumber: true,
                setValueAs: (value) => value === "" ? null : Number(value)
              })}
              className={`form-input ${errors.birthYear ? "input-error" : ""}`}
              placeholder="1990"
              min="1900"
              max={new Date().getFullYear()}
            />
            {errors.birthYear && (
              <p className="form-error">{errors.birthYear.message}</p>
            )}
          </div>
          <div className="form-group" style={{ flex: 1 }}>
            <label htmlFor="countryCode" className="form-label">
              Pays
            </label>
            <CountrySelect
              key={`country-${artist.countryCode || 'empty'}`}
              countries={getCountries()}
              value={countryCode || artist.countryCode || ""}
              onChange={(code) => setValue("countryCode", code)}
              placeholder="Sélectionner un pays"
            />
            {errors.countryCode && (
              <p className="form-error">{errors.countryCode.message}</p>
            )}
          </div>
        </div>

        {/* Section Expositions */}
        <div className="form-group mb-4">
          <h3
            className="h5 mb-3"
            style={{
              borderBottom: "2px solid #e0e0e0",
              paddingBottom: "0.5rem",
            }}
          >
            Expositions et parcours (optionnel)
          </h3>
          <p
            className="form-help text-muted mb-3"
            style={{ fontSize: "0.875rem" }}
          >
            Vous pouvez ajouter jusqu'à 4 expositions ou événements marquants
            de votre parcours artistique.
          </p>

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
                Exposition {num}
              </h4>
              <div className="form-group mb-3">
                <label htmlFor={headerKey} className="form-label">
                  Titre de l'exposition {num}
                </label>
                <input
                  id={headerKey}
                  type="text"
                  {...register(headerKey)}
                  className="form-input"
                  placeholder={`Ex: "Exposition collective à la Galerie X"`}
                />
              </div>
              <div className="form-group">
                <label htmlFor={textKey} className="form-label">
                  Description de l'exposition {num}
                </label>
                <textarea
                  id={textKey}
                  {...register(textKey)}
                  className="form-textarea"
                  rows={4}
                  placeholder={`Décrivez cette exposition, son contexte, son importance dans votre parcours...`}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="form-group mb-4">
          <h3
            className="h5 mb-3"
            style={{
              borderBottom: "2px solid #e0e0e0",
              paddingBottom: "0.5rem",
            }}
          >
            Réseaux sociaux (facultatif)
          </h3>
          <div className="form-group mb-3">
            <label htmlFor="websiteUrl" className="form-label">
              Site web
            </label>
            <input
              id="websiteUrl"
              type="url"
              {...register("websiteUrl")}
              className={`form-input ${errors.websiteUrl ? "input-error" : ""}`}
              placeholder="https://www.example.com"
            />
            {errors.websiteUrl && (
              <p className="form-error">{errors.websiteUrl.message}</p>
            )}
          </div>

          <div className="d-flex gap-md">
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="facebookUrl" className="form-label">
                Facebook
              </label>
              <input
                id="facebookUrl"
                type="url"
                {...register("facebookUrl")}
                className={`form-input ${
                  errors.facebookUrl ? "input-error" : ""
                }`}
                placeholder="https://facebook.com/profile"
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
                type="url"
                {...register("instagramUrl")}
                className={`form-input ${
                  errors.instagramUrl ? "input-error" : ""
                }`}
                placeholder="https://instagram.com/profile"
              />
              {errors.instagramUrl && (
                <p className="form-error">{errors.instagramUrl.message}</p>
              )}
            </div>
          </div>

          <div className="d-flex gap-md mt-3">
            <div className="form-group" style={{ flex: 1 }}>
              <label htmlFor="twitterUrl" className="form-label">
                Twitter
              </label>
              <input
                id="twitterUrl"
                type="url"
                {...register("twitterUrl")}
                className={`form-input ${
                  errors.twitterUrl ? "input-error" : ""
                }`}
                placeholder="https://twitter.com/profile"
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
                type="url"
                {...register("linkedinUrl")}
                className={`form-input ${
                  errors.linkedinUrl ? "input-error" : ""
                }`}
                placeholder="https://linkedin.com/profile"
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
            Annuler
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={isSubmitting}
            isLoading={isSubmitting}
            loadingText="Mise à jour en cours..."
          >
            Mettre à jour mon profil
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

