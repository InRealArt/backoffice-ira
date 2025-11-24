"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/components/Toast/ToastContext";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createUserArtistProfile } from "@/lib/actions/artist-actions";
import CountrySelect from "@/app/components/Common/CountrySelect";
import { getCountries } from "@/lib/utils";
import Button from "@/app/components/Button/Button";
import ArtistImageUpload from "./ArtistImageUpload";
import OptionalImageUpload from "./OptionalImageUpload";
import ProgressModal from "./ProgressModal";

// Schéma de validation simplifié pour un utilisateur
const formSchema = z.object({
  name: z.string().min(1, "Le prénom est requis"),
  surname: z.string().min(1, "Le nom est requis"),
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

interface CreateArtistProfileFormProps {
  userEmail: string;
}

export default function CreateArtistProfileForm({
  userEmail,
}: CreateArtistProfileFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [secondaryImageFile, setSecondaryImageFile] = useState<File | null>(
    null
  );
  const [studioImageFile, setStudioImageFile] = useState<File | null>(null);
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
    { id: "creation", label: "Création du profil artiste", status: "pending" },
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
    formState: { errors, dirtyFields },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      surname: "",
      pseudo: "",
      description: "",
      artistsPage: false,
      birthYear: null,
      countryCode: null,
      websiteUrl: "",
      facebookUrl: "",
      instagramUrl: "",
      twitterUrl: "",
      linkedinUrl: "",
      biographyHeader1: "",
      biographyText1: "",
      biographyHeader2: "",
      biographyText2: "",
      biographyHeader3: "",
      biographyText3: "",
      biographyHeader4: "",
      biographyText4: "",
    },
  });

  const countryCode = watch("countryCode");
  const artistsPage = watch("artistsPage");
  const name = watch("name");
  const surname = watch("surname");

  // Auto-remplissage du pseudo
  useEffect(() => {
    if (!dirtyFields.pseudo) {
      const generatedPseudo = `${name} ${surname}`.trim();
      if (generatedPseudo) {
        setValue("pseudo", generatedPseudo);
      }
    }
  }, [name, surname, setValue, dirtyFields.pseudo]);

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
      // Les erreurs sont déjà gérées dans uploadArtistImageWithWebP
      // et les callbacks ont été appelés, on propage juste l'erreur
      throw error;
    }
  };

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
        id: "creation",
        label: "Création du profil artiste",
        status: "pending",
      },
      { id: "finalization", label: "Finalisation", status: "pending" },
    ]);

    try {
      // Étape 1: Validation
      updateStepStatus("validation", "in-progress");

      // Vérifier qu'une image a été sélectionnée
      if (!selectedImageFile) {
        updateStepStatus("validation", "error");
        setProgressError("Veuillez sélectionner une photo de profil");
        setFormError("Veuillez sélectionner une photo de profil");
        errorToast("Veuillez sélectionner une photo de profil");
        setIsSubmitting(false);
        return;
      }

      updateStepStatus("validation", "completed");

      // Étape 2-3: Upload côté client (conversion + upload Firebase)
      let imageUrl: string;
      let secondaryImageUrl: string | null = null;
      let studioImageUrl: string | null = null;

      try {
        // Upload de l'image principale
        imageUrl = await handleUpload(
          selectedImageFile,
          data.name,
          data.surname,
          "profile"
        );

        // Upload de l'image secondaire si fournie
        if (secondaryImageFile) {
          try {
            secondaryImageUrl = await handleUpload(
              secondaryImageFile,
              data.name,
              data.surname,
              "secondary"
            );
          } catch (err) {
            console.warn("Erreur lors de l'upload de l'image secondaire:", err);
            // Ne pas bloquer la soumission si l'image secondaire échoue
          }
        }

        // Upload de l'image du studio si fournie
        if (studioImageFile) {
          try {
            studioImageUrl = await handleUpload(
              studioImageFile,
              data.name,
              data.surname,
              "studio"
            );
          } catch (err) {
            console.warn("Erreur lors de l'upload de l'image du studio:", err);
            // Ne pas bloquer la soumission si l'image du studio échoue
          }
        }
      } catch (uploadError: any) {
        // Détecter si c'est une erreur de conversion ou d'upload
        const errorMessage = uploadError?.message || "Erreur lors de l'upload";

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

      // Étape 4: Création du profil (Server Action)
      updateStepStatus("creation", "in-progress");

      // Créer un FormData pour envoyer les données
      const formData = new FormData();
      formData.append("imageUrl", imageUrl); // ← Envoyer l'URL au lieu du fichier
      formData.append("name", data.name);
      formData.append("surname", data.surname);
      formData.append("pseudo", data.pseudo);
      formData.append("description", data.description);
      formData.append("artistsPage", data.artistsPage.toString());
      formData.append("userEmail", userEmail);

      if (secondaryImageUrl) {
        formData.append("secondaryImageUrl", secondaryImageUrl);
      }
      if (studioImageUrl) {
        formData.append("imageArtistStudio", studioImageUrl);
      }

      if (data.birthYear) {
        formData.append("birthYear", data.birthYear.toString());
      }
      if (data.countryCode) {
        formData.append("countryCode", data.countryCode);
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

      const result = await createUserArtistProfile(formData);

      updateStepStatus("creation", "completed");

      if (result.success) {
        // Étape 5: Finalisation
        updateStepStatus("finalization", "in-progress");
        await new Promise((resolve) => setTimeout(resolve, 500)); // Petit délai pour l'UX
        updateStepStatus("finalization", "completed");

        success("Profil artiste créé avec succès");

        // Fermer le modal après un court délai
        setTimeout(() => {
          setShowProgressModal(false);
          router.push("/dashboard");
          router.refresh();
        }, 1000);
      } else {
        updateStepStatus("creation", "error");
        setProgressError(result.message || "Une erreur est survenue");
        errorToast(result.message || "Une erreur est survenue");
        setFormError(
          result.message || "Échec de la création du profil artiste"
        );
        setIsSubmitting(false);
      }
    } catch (error: any) {
      console.error("Erreur lors de la création du profil artiste:", error);
      const errorMessage =
        error?.message ||
        "Une erreur est survenue lors de la création du profil artiste";

      // Marquer l'étape de création comme erreur (les autres étapes sont déjà gérées)
      updateStepStatus("creation", "error");

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
                onFileSelect={setSelectedImageFile}
                error={
                  formError && !selectedImageFile
                    ? "Une photo de profil est requise"
                    : undefined
                }
              />
            </div>

            <div style={{ flex: 1 }}>
              <div className="d-flex gap-md mb-3">
                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="name" className="form-label">
                    Prénom *
                  </label>
                  <input
                    id="name"
                    type="text"
                    {...register("name")}
                    className={`form-input ${errors.name ? "input-error" : ""}`}
                  />
                  {errors.name && (
                    <p className="form-error">{errors.name.message}</p>
                  )}
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label htmlFor="surname" className="form-label">
                    Nom *
                  </label>
                  <input
                    id="surname"
                    type="text"
                    {...register("surname")}
                    className={`form-input ${
                      errors.surname ? "input-error" : ""
                    }`}
                  />
                  {errors.surname && (
                    <p className="form-error">{errors.surname.message}</p>
                  )}
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
                onFileSelect={setSecondaryImageFile}
                label="Image secondaire de l'artiste"
                description="Une photo supplémentaire de vous pour enrichir votre profil"
              />
            </div>
            <div style={{ flex: "1 1 300px", minWidth: "250px" }}>
              <OptionalImageUpload
                onFileSelect={setStudioImageFile}
                label="Image de votre studio"
                description="Une photo de votre espace de travail ou atelier"
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
              id="birthYear"
              type="number"
              {...register("birthYear", { valueAsNumber: true })}
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
              countries={getCountries()}
              value={countryCode || ""}
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
            Vous pouvez ajouter jusqu'à 4 expositions ou événements marquants de
            votre parcours artistique.
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
            loadingText="Création en cours..."
          >
            Créer mon profil artiste
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
