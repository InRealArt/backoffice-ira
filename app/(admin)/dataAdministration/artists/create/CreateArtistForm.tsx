"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/components/Toast/ToastContext";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createArtist } from "@/lib/actions/artist-actions";
import styles from "./createArtistForm.module.scss";
import CountrySelect from "@/app/components/Common/CountrySelect";
import { getCountries } from "@/lib/utils";
import OptionalImageUpload from "@/app/components/art/OptionalImageUpload";
import ProgressModal from "@/app/components/art/ProgressModal";

// Schéma de validation
// Règle : pseudo seul OU (prénom + nom) sont requis. Les deux ensembles sont aussi valides.
const formSchema = z
  .object({
  name: z.string().optional().or(z.literal("")),
  surname: z.string().optional().or(z.literal("")),
  pseudo: z.string().optional().or(z.literal("")),
  description: z
    .string()
    .min(10, "La description doit contenir au moins 10 caractères"),
  artistsPage: z.boolean().default(false),
  publicKey: z.string().optional().or(z.literal("")),
  imageUrl: z.string().url("URL d'image invalide").optional().or(z.literal("")),
  isGallery: z.boolean().default(false),
  backgroundImage: z.string().optional().or(z.literal("")).nullable(),
  // Nouveaux champs biographie
  birthYear: z
    .union([
      z
        .number()
        .min(1900, "L'année de naissance doit être supérieure à 1900")
        .max(
          new Date().getFullYear(),
          "L'année de naissance ne peut pas être dans le futur"
        ),
      z.null(),
      z.undefined(),
    ])
    .optional(),
  countryCode: z
    .string()
    .min(2, "Le code pays doit contenir au moins 2 caractères")
    .max(3, "Le code pays ne peut pas dépasser 3 caractères")
    .nullable()
    .optional(),
  // Nouveaux champs réseaux sociaux
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
}).superRefine((data, ctx) => {
  const hasPseudo = data.pseudo && data.pseudo.trim().length > 0;
  const hasName = data.name && data.name.trim().length > 0;
  const hasSurname = data.surname && data.surname.trim().length > 0;

  if (!hasPseudo && !hasName && !hasSurname) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Renseignez un pseudo ou un prénom et un nom",
      path: ["pseudo"],
    });
  }

  if (!hasPseudo && (hasName || hasSurname) && !(hasName && hasSurname)) {
    if (!hasName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le prénom est requis avec le nom",
        path: ["name"],
      });
    }
    if (!hasSurname) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Le nom est requis avec le prénom",
        path: ["surname"],
      });
    }
  }
});

type FormValues = z.infer<typeof formSchema>;

export default function CreateArtistForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
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
    { id: "creation", label: "Création de l'artiste", status: "pending" },
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
    formState: { errors, isDirty, isValid },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      surname: "",
      pseudo: "",
      description: "",
      artistsPage: false,
      publicKey: "",
      imageUrl: "",
      isGallery: false,
      backgroundImage: "",
      birthYear: null,
      countryCode: null,
      websiteUrl: "",
      facebookUrl: "",
      instagramUrl: "",
      twitterUrl: "",
      linkedinUrl: "",
    },
  });

  const imageUrl = watch("imageUrl");
  const isGallery = watch("isGallery");
  const countryCode = watch("countryCode");

  // Debug: Surveiller toutes les données du formulaire
  const allFormData = watch();

  // Effet pour débugger les changements de données
  useEffect(() => {
    console.log("📊 Données du formulaire mises à jour:", allFormData);

    // Vérifier les champs non autorisés
    const allowedFields = [
      "name",
      "surname",
      "pseudo",
      "description",
      "artistsPage",
      "publicKey",
      "imageUrl",
      "isGallery",
      "backgroundImage",
      "birthYear",
      "countryCode",
      "websiteUrl",
      "facebookUrl",
      "instagramUrl",
      "twitterUrl",
      "linkedinUrl",
    ];
    const extraFields = Object.keys(allFormData).filter(
      (key) => !allowedFields.includes(key)
    );
    if (extraFields.length > 0) {
      console.warn("⚠️ Champs non autorisés dans watch():", extraFields);
      console.warn(
        "⚠️ Valeurs:",
        extraFields.reduce(
          (obj, key) => ({ ...obj, [key]: (allFormData as any)[key] }),
          {}
        )
      );
    }
  }, [allFormData]);

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
    surname: string
  ): Promise<string> => {
    const { uploadArtistImageWithWebP } = await import(
      "@/lib/firebase/storage"
    );

    try {
      return await uploadArtistImageWithWebP(imageFile, {
        name,
        surname,
        imageType: "profile",
        normalizeFolderName: false, // Garder la casse originale comme demandé
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

  // Cette fonction est appelée lorsqu'il y a des erreurs de validation dans le formulaire
  const onError = (errors: any) => {
    console.error("Erreurs de validation du formulaire:", errors);

    // Debug: Capturer toutes les données du formulaire même en cas d'erreur
    const currentFormData = watch();
    console.log(
      "🔍 Données complètes du formulaire (avec erreurs):",
      currentFormData
    );

    // Identifier les champs non autorisés
    const allowedFields = [
      "name",
      "surname",
      "pseudo",
      "description",
      "artistsPage",
      "publicKey",
      "imageUrl",
      "isGallery",
      "backgroundImage",
      "birthYear",
      "countryCode",
      "websiteUrl",
      "facebookUrl",
      "instagramUrl",
      "twitterUrl",
      "linkedinUrl",
    ];
    const extraFields = Object.keys(currentFormData).filter(
      (key) => !allowedFields.includes(key)
    );
    if (extraFields.length > 0) {
      console.error("🚨 CHAMPS FANTÔMES DÉTECTÉS:", extraFields);
      console.error(
        "🚨 Valeurs des champs fantômes:",
        extraFields.reduce(
          (obj, key) => ({ ...obj, [key]: (currentFormData as any)[key] }),
          {}
        )
      );
    }

    setFormError(
      "Le formulaire contient des erreurs. Veuillez les corriger avant de soumettre."
    );
    setIsSubmitting(false);
  };

  const onSubmit = async (data: FormValues) => {
    // Réinitialiser les états d'erreur
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
      { id: "creation", label: "Création de l'artiste", status: "pending" },
      { id: "finalization", label: "Finalisation", status: "pending" },
    ]);

    try {
      // Étape 1: Validation
      updateStepStatus("validation", "in-progress");

      // Vérifier qu'une image a été sélectionnée
      if (!selectedImageFile) {
        updateStepStatus("validation", "error");
        setProgressError("Veuillez sélectionner une image");
        setFormError("Veuillez sélectionner une image");
        errorToast("Veuillez sélectionner une image");
        setIsSubmitting(false);
        return;
      }

      updateStepStatus("validation", "completed");

      // Étape 2-3: Upload côté client (conversion + upload Firebase)
      let finalImageUrl: string;

      try {
        // Upload de l'image principale — utilise pseudo comme fallback si pas de nom/prénom
        finalImageUrl = await handleUpload(
          selectedImageFile,
          data.name || data.pseudo || "",
          data.surname || ""
        );
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

      // Étape 4: Création de l'artiste (Server Action)
      updateStepStatus("creation", "in-progress");

      // Filtrer explicitement les champs autorisés pour éviter les champs fantômes
      const cleanedData = {
        name: data.name,
        surname: data.surname,
        pseudo: data.pseudo,
        description: data.description,
        artistsPage: data.artistsPage,
        publicKey: data.publicKey,
        imageUrl: finalImageUrl, // Utiliser l'URL de l'image uploadée
        isGallery: data.isGallery,
        backgroundImage: data.backgroundImage,
        birthYear: data.birthYear,
        countryCode: data.countryCode,
        websiteUrl: data.websiteUrl,
        facebookUrl: data.facebookUrl,
        instagramUrl: data.instagramUrl,
        twitterUrl: data.twitterUrl,
        linkedinUrl: data.linkedinUrl,
      };

      // Transformer undefined en null pour backgroundImage
      const formattedData = {
        ...cleanedData,
        backgroundImage: cleanedData.backgroundImage || null,
        publicKey: cleanedData.publicKey || `default-${Date.now()}`,
      };

      // Appel de la fonction server action
      const result = await createArtist(formattedData);

      updateStepStatus("creation", "completed");

      if (result.success) {
        // Étape 5: Finalisation
        updateStepStatus("finalization", "in-progress");
        await new Promise((resolve) => setTimeout(resolve, 500)); // Petit délai pour l'UX
        updateStepStatus("finalization", "completed");

        success("Artiste créé avec succès");

        // Fermer le modal après un court délai
        setTimeout(() => {
          setShowProgressModal(false);
          router.push("/dataAdministration/artists");
          router.refresh();
        }, 1000);
      } else {
        updateStepStatus("creation", "error");
        setProgressError(result.message || "Une erreur est survenue");
        errorToast(result.message || "Une erreur est survenue");
        setFormError(result.message || "Échec de la création de l'artiste");
        setIsSubmitting(false);
      }
    } catch (error: any) {
      console.error("Exception lors de la création de l'artiste:", error);
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

  const handleCancel = () => {
    router.push("/dataAdministration/artists");
  };

  return (
    <div className={styles["page-container"]}>
      <div className={styles["page-header"]}>
        <div className={styles["header-top-section"]}>
          <h1 className={styles["page-title"]}>Créer un artiste</h1>
        </div>
        <p className={styles["page-subtitle"]}>
          Ajouter un nouvel artiste dans le système
        </p>
      </div>

      {formError && (
        <div
          className={styles["alert"] + " " + styles["alert-danger"]}
          style={{ marginBottom: "20px" }}
        >
          {formError}
        </div>
      )}

      <form
        onSubmit={handleSubmit(onSubmit, onError)}
        className={styles["form-container"]}
      >
        <div className={styles["form-card"]}>
          <div className={styles["card-content"]}>
            <div className={styles["d-flex"] + " " + styles["gap-lg"]}>
              <div
                className={
                  styles["d-flex"] +
                  " " +
                  styles["flex-column"] +
                  " " +
                  styles["gap-md"]
                }
                style={{ width: "200px" }}
              >
                <OptionalImageUpload
                  onFileSelect={setSelectedImageFile}
                  label="Photo de profil"
                  description="Cliquez ou glissez-déposez une image"
                  previewUrl={imageUrl || null}
                  error={
                    formError && !selectedImageFile
                      ? "Une image est requise"
                      : undefined
                  }
                  allowDelete={true}
                />
              </div>

              <div style={{ flex: 1 }}>
                <div className={styles["form-group"]}>
                  <div
                    className={
                      styles["d-flex"] +
                      " " +
                      styles["align-items-center"] +
                      " " +
                      styles["gap-md"]
                    }
                    style={{ marginBottom: "20px" }}
                  >
                    <span
                      className={
                        isGallery
                          ? styles["text-muted"]
                          : styles["text-primary"]
                      }
                      style={{ fontWeight: isGallery ? "normal" : "bold" }}
                    >
                      Artiste
                    </span>
                    <label
                      className={
                        styles["d-flex"] + " " + styles["align-items-center"]
                      }
                      style={{
                        position: "relative",
                        display: "inline-block",
                        width: "60px",
                        height: "30px",
                      }}
                    >
                      <input
                        type="checkbox"
                        {...register("isGallery")}
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
                          backgroundColor: isGallery ? "#4f46e5" : "#ccc",
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
                            transform: isGallery
                              ? "translateX(30px)"
                              : "translateX(0)",
                          }}
                        ></span>
                      </span>
                    </label>
                    <span
                      className={
                        isGallery
                          ? styles["text-primary"]
                          : styles["text-muted"]
                      }
                      style={{ fontWeight: isGallery ? "bold" : "normal" }}
                    >
                      Galerie
                    </span>
                  </div>

                  <div className={styles["d-flex"] + " " + styles["gap-md"]}>
                    <div className={styles["form-group"]} style={{ flex: 1 }}>
                      <label htmlFor="name" className={styles["form-label"]}>
                        Prénom
                      </label>
                      <input
                        id="name"
                        type="text"
                        {...register("name")}
                        className={`${styles["form-input"]} ${
                          errors.name ? styles["input-error"] : ""
                        }`}
                        placeholder="Optionnel si pseudo renseigné"
                      />
                      {errors.name && (
                        <p className={styles["form-error"]}>
                          {errors.name.message}
                        </p>
                      )}
                    </div>
                    <div className={styles["form-group"]} style={{ flex: 1 }}>
                      <label htmlFor="surname" className={styles["form-label"]}>
                        Nom
                      </label>
                      <input
                        id="surname"
                        type="text"
                        {...register("surname")}
                        className={`${styles["form-input"]} ${
                          errors.surname ? styles["input-error"] : ""
                        }`}
                        placeholder="Optionnel si pseudo renseigné"
                      />
                      {errors.surname && (
                        <p className={styles["form-error"]}>
                          {errors.surname.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className={styles["form-group"]}>
                    <label htmlFor="pseudo" className={styles["form-label"]}>
                      Pseudo
                    </label>
                    <input
                      id="pseudo"
                      type="text"
                      {...register("pseudo")}
                      className={`${styles["form-input"]} ${errors.pseudo ? styles["input-error"] : ""}`}
                      placeholder="Optionnel si prénom et nom renseignés"
                    />
                    {errors.pseudo && (
                      <p className={styles["form-error"]}>
                        {errors.pseudo.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className={styles["form-card"]}>
          <div className={styles["card-content"]}>
            <div className={styles["form-group"]}>
              <label htmlFor="description" className={styles["form-label"]}>
                Description
              </label>
              <textarea
                id="description"
                {...register("description")}
                className={`${styles["form-textarea"]} ${
                  errors.description ? styles["input-error"] : ""
                }`}
                rows={5}
              />
              {errors.description && (
                <p className={styles["form-error"]}>
                  {errors.description.message}
                </p>
              )}
            </div>

            <div className={styles["form-group"]}>
              <label htmlFor="publicKey" className={styles["form-label"]}>
                Clé publique (facultatif)
              </label>
              <input
                id="publicKey"
                type="text"
                {...register("publicKey")}
                className={`${styles["form-input"]} ${
                  errors.publicKey ? styles["input-error"] : ""
                }`}
              />
              {errors.publicKey && (
                <p className={styles["form-error"]}>
                  {errors.publicKey.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Section Biographie */}
        <div className={styles["form-card"]}>
          <div className={styles["card-content"]}>
            <h3 className={styles["section-title"]}>Biographie</h3>
            <div className={styles["d-flex"] + " " + styles["gap-md"]}>
              <div className={styles["form-group"]} style={{ flex: 1 }}>
                <label htmlFor="birthYear" className={styles["form-label"]}>
                  Année de naissance (optionnel)
                </label>
                <input
                  id="birthYear"
                  type="number"
                  {...register("birthYear", {
                    valueAsNumber: true,
                    setValueAs: (value) => {
                      if (
                        value === "" ||
                        value === null ||
                        value === undefined
                      ) {
                        return undefined;
                      }
                      const numValue = Number(value);
                      return isNaN(numValue) ? undefined : numValue;
                    },
                  })}
                  className={`${styles["form-input"]} ${
                    errors.birthYear ? styles["input-error"] : ""
                  }`}
                  placeholder="1990"
                  min="1900"
                  max={new Date().getFullYear()}
                />
                {errors.birthYear && (
                  <p className={styles["form-error"]}>
                    {errors.birthYear.message}
                  </p>
                )}
              </div>
              <div className={styles["form-group"]} style={{ flex: 1 }}>
                <label htmlFor="countryCode" className={styles["form-label"]}>
                  Code pays
                </label>
                <CountrySelect
                  countries={getCountries()}
                  value={countryCode || ""}
                  onChange={(code) => setValue("countryCode", code)}
                  placeholder="Sélectionner un pays"
                />
                {errors.countryCode && (
                  <p className={styles["form-error"]}>
                    {errors.countryCode.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Section Réseaux sociaux */}
        <div className={styles["form-card"]}>
          <div className={styles["card-content"]}>
            <h3 className={styles["section-title"]}>Réseaux sociaux</h3>
            <div className={styles["form-group"]}>
              <label htmlFor="websiteUrl" className={styles["form-label"]}>
                Site web
              </label>
              <input
                id="websiteUrl"
                type="url"
                {...register("websiteUrl")}
                className={`${styles["form-input"]} ${
                  errors.websiteUrl ? styles["input-error"] : ""
                }`}
                placeholder="https://www.example.com"
              />
              {errors.websiteUrl && (
                <p className={styles["form-error"]}>
                  {errors.websiteUrl.message}
                </p>
              )}
            </div>

            <div className={styles["d-flex"] + " " + styles["gap-md"]}>
              <div className={styles["form-group"]} style={{ flex: 1 }}>
                <label htmlFor="facebookUrl" className={styles["form-label"]}>
                  Facebook
                </label>
                <input
                  id="facebookUrl"
                  type="url"
                  {...register("facebookUrl")}
                  className={`${styles["form-input"]} ${
                    errors.facebookUrl ? styles["input-error"] : ""
                  }`}
                  placeholder="https://facebook.com/profile"
                />
                {errors.facebookUrl && (
                  <p className={styles["form-error"]}>
                    {errors.facebookUrl.message}
                  </p>
                )}
              </div>
              <div className={styles["form-group"]} style={{ flex: 1 }}>
                <label htmlFor="instagramUrl" className={styles["form-label"]}>
                  Instagram
                </label>
                <input
                  id="instagramUrl"
                  type="url"
                  {...register("instagramUrl")}
                  className={`${styles["form-input"]} ${
                    errors.instagramUrl ? styles["input-error"] : ""
                  }`}
                  placeholder="https://instagram.com/profile"
                />
                {errors.instagramUrl && (
                  <p className={styles["form-error"]}>
                    {errors.instagramUrl.message}
                  </p>
                )}
              </div>
            </div>

            <div className={styles["d-flex"] + " " + styles["gap-md"]}>
              <div className={styles["form-group"]} style={{ flex: 1 }}>
                <label htmlFor="twitterUrl" className={styles["form-label"]}>
                  Twitter
                </label>
                <input
                  id="twitterUrl"
                  type="url"
                  {...register("twitterUrl")}
                  className={`${styles["form-input"]} ${
                    errors.twitterUrl ? styles["input-error"] : ""
                  }`}
                  placeholder="https://twitter.com/profile"
                />
                {errors.twitterUrl && (
                  <p className={styles["form-error"]}>
                    {errors.twitterUrl.message}
                  </p>
                )}
              </div>
              <div className={styles["form-group"]} style={{ flex: 1 }}>
                <label htmlFor="linkedinUrl" className={styles["form-label"]}>
                  LinkedIn
                </label>
                <input
                  id="linkedinUrl"
                  type="url"
                  {...register("linkedinUrl")}
                  className={`${styles["form-input"]} ${
                    errors.linkedinUrl ? styles["input-error"] : ""
                  }`}
                  placeholder="https://linkedin.com/in/profile"
                />
                {errors.linkedinUrl && (
                  <p className={styles["form-error"]}>
                    {errors.linkedinUrl.message}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={styles["form-actions"]}>
          <button
            type="button"
            onClick={handleCancel}
            className={`${styles.btn} ${styles["btn-secondary"]} ${styles["btn-medium"]}`}
            disabled={isSubmitting}
          >
            Annuler
          </button>
          <button
            type="submit"
            className={`${styles.btn} ${styles["btn-primary"]} ${styles["btn-medium"]}`}
            disabled={isSubmitting || !isDirty}
          >
            {isSubmitting ? (
              <>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span className={styles["loading-spinner"]}></span>
                  Création en cours...
                </span>
              </>
            ) : (
              "Créer l'artiste"
            )}
          </button>
        </div>
      </form>

      {/* Modal de progression */}
      <ProgressModal
        isOpen={showProgressModal}
        steps={progressSteps}
        currentError={progressError}
      />
    </div>
  );
}
