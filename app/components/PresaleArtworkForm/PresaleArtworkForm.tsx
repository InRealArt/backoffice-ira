"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useToast } from "@/app/components/Toast/ToastContext";
import Image from "next/image";
import { X, Plus, AlertCircle, Camera } from "lucide-react";
import LoadingSpinner from "@/app/components/LoadingSpinner/LoadingSpinner";
import { useDropzone } from "react-dropzone";
import {
  createPresaleArtwork,
  updatePresaleArtwork,
  getPresaleArtworkById,
} from "@/lib/actions/presale-artwork-actions";
import { getAllArtistsAndGalleries } from "@/lib/actions/artist-actions";
import { handleEntityTranslations } from "@/lib/actions/translation-actions";
import TranslationField from "@/app/components/TranslationField";
import { uploadImageToFirebase } from "@/lib/firebase/storage";
import { uploadMockupToFirebase } from "@/lib/firebase/storage";
import {
  uploadImageToLandingFolder,
  ensureFolderExists,
} from "@/lib/firebase/storage";
import { convertToWebPIfNeeded } from "@/lib/utils/webp-converter";
import { normalizeString } from "@/lib/utils";
import ProgressModal from "@/app/components/art/ProgressModal";

// Fonction pour créer le schéma de validation avec traductions
const createPresaleArtworkSchema = (t: (key: string) => string) =>
  z.object({
    name: z.string().min(1, t("validation.nameRequired")),
    artistId: z.string().min(1, t("validation.artistRequired")),
    imageUrl: z.string().optional(), // Sera validé manuellement si un fichier est uploadé
    description: z.string().optional(),
    price: z.string().optional(),
    width: z.string().optional(),
    height: z.string().optional(),
    isSold: z.boolean().optional().default(false),
  });

type PresaleArtworkFormValues = z.infer<
  ReturnType<typeof createPresaleArtworkSchema>
>;

interface Artist {
  id: number;
  name: string;
  surname: string;
}

export interface PresaleArtworkFormProps {
  mode: "create" | "edit";
  presaleArtworkId?: number;
  /**
   * ID de l'artiste à pré-sélectionner (pour les artistes connectés)
   * Si fourni, le champ artiste sera en lecture seule
   */
  defaultArtistId?: number;
  /**
   * URL de redirection après succès (par défaut: router.back())
   */
  redirectUrl?: string;
  /**
   * Titre personnalisé de la page
   */
  pageTitle?: string;
  /**
   * Sous-titre personnalisé de la page
   */
  pageSubtitle?: string;
}

function ImageThumbnail({ url, alt }: { url: string; alt: string }) {
  return (
    <div className="inline-flex items-center">
      <div className="relative w-6 h-6 mr-1">
        <Image
          src={url}
          alt={alt}
          width={96}
          height={96}
          className="object-cover"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </div>
      <span className="text-xs text-gray-500">✓</span>
    </div>
  );
}

export default function PresaleArtworkForm({
  mode,
  presaleArtworkId,
  defaultArtistId,
  redirectUrl,
  pageTitle,
  pageSubtitle,
}: PresaleArtworkFormProps) {
  const router = useRouter();
  const t = useTranslations("art.presaleArtworkForm");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(mode === "edit");
  const [artists, setArtists] = useState<Artist[]>([]);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [mockupUrls, setMockupUrls] = useState<{ name: string; url: string }[]>(
    []
  );
  const [newMockupName, setNewMockupName] = useState("");
  const [mainImageFile, setMainImageFile] = useState<File | null>(null);
  const [mockupFiles, setMockupFiles] = useState<
    { name: string; file: File }[]
  >([]);
  const [uploadingMainImage, setUploadingMainImage] = useState(false);
  const [uploadingMockups, setUploadingMockups] = useState<number[]>([]);
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
  const mainImageInputRef = useRef<HTMLInputElement>(null);
  const { success, error: showError, info } = useToast();

  // Fonction pour gérer l'annulation
  const handleCancel = () => {
    // Utiliser l'historique du navigateur pour un retour naturel
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(redirectUrl || "/landing/presaleArtworks");
    }
  };

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<PresaleArtworkFormValues>({
    resolver: zodResolver(createPresaleArtworkSchema(t)),
    defaultValues: {
      name: "",
      artistId: defaultArtistId ? defaultArtistId.toString() : "",
      price: "",
      imageUrl: "",
      description: "",
      width: "",
      height: "",
      isSold: false,
    },
  });

  // Récupérer les artistes
  useEffect(() => {
    const fetchArtists = async () => {
      try {
        const artistsData = await getAllArtistsAndGalleries();
        setArtists(artistsData);
      } catch (error: any) {
        console.error("Erreur lors de la récupération des artistes:", error);
        showError(t("errors.fetchArtists"));
      }
    };

    fetchArtists();
  }, [showError, t]);

  // Pré-sélectionner l'artiste par défaut une fois que les artistes sont chargés
  useEffect(() => {
    if (defaultArtistId && mode === "create" && artists.length > 0) {
      // Vérifier que l'artiste existe dans la liste avant de le sélectionner
      const artistExists = artists.some(
        (artist) => artist.id === defaultArtistId
      );
      if (artistExists) {
        const currentValue = getValues("artistId");
        const targetValue = defaultArtistId.toString();
        // Forcer la mise à jour si la valeur n'est pas correcte
        if (currentValue !== targetValue) {
          // Utiliser setTimeout pour s'assurer que le DOM est prêt
          setTimeout(() => {
            setValue("artistId", targetValue, {
              shouldValidate: true,
              shouldDirty: false,
            });
          }, 0);
        }
      }
    }
  }, [defaultArtistId, mode, artists, setValue, getValues]);

  // Récupérer les données de l'œuvre en prévente si mode edit
  useEffect(() => {
    const fetchPresaleArtwork = async () => {
      if (mode === "edit" && presaleArtworkId) {
        try {
          const presaleArtwork = await getPresaleArtworkById(presaleArtworkId);

          if (presaleArtwork) {
            setValue("name", presaleArtwork.name);
            setValue("artistId", presaleArtwork.artistId.toString());
            setValue("price", presaleArtwork.price?.toString() || "");
            setValue("imageUrl", presaleArtwork.imageUrl);
            setValue("description", presaleArtwork.description || "");
            setValue("width", presaleArtwork.width?.toString() || "");
            setValue("height", presaleArtwork.height?.toString() || "");
            setValue("isSold", presaleArtwork.isSold ?? false);
            setImagePreview(presaleArtwork.imageUrl);

            // Initialiser les URLs de mockups
            if (presaleArtwork.mockupUrls) {
              try {
                const parsedMockups = JSON.parse(
                  presaleArtwork.mockupUrls as string
                );
                // Conversion d'anciens formats (simples URLs) vers le nouveau format {name, url}
                if (Array.isArray(parsedMockups)) {
                  setMockupUrls(
                    parsedMockups.map((item) => {
                      if (typeof item === "string") {
                        return { name: "", url: item };
                      } else if (typeof item === "object" && item.url) {
                        return item;
                      }
                      return { name: "", url: "" };
                    })
                  );
                } else {
                  setMockupUrls([]);
                }
              } catch (error) {
                console.error("Erreur lors du parsing des mockups:", error);
                setMockupUrls([]);
              }
            }
          } else {
            showError(t("errors.artworkNotFound"));
            router.push(redirectUrl || "/landing/presaleArtworks");
          }
        } catch (error: any) {
          console.error(
            "Erreur lors de la récupération de l'œuvre en prévente:",
            error
          );
          showError(t("errors.fetchArtwork"));
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    fetchPresaleArtwork();
  }, [mode, presaleArtworkId, setValue, router, redirectUrl, showError, t]);

  const onSubmit = async (data: PresaleArtworkFormValues) => {
    setIsSubmitting(true);

    try {
      // Récupérer les informations de l'artiste sélectionné
      const selectedArtist = artists.find(
        (a) => a.id.toString() === data.artistId
      );
      if (!selectedArtist) {
        showError(t("errors.selectArtist"));
        setIsSubmitting(false);
        return;
      }

      // Validation manuelle : vérifier qu'une image est fournie (soit URL, soit fichier)
      if (!mainImageFile && !data.imageUrl) {
        showError(t("errors.imageRequired"));
        setIsSubmitting(false);
        return;
      }

      let finalImageUrl = data.imageUrl || "";

      // Upload de l'image principale si un fichier a été sélectionné
      if (mainImageFile) {
        // Préparer le nom du répertoire Firebase
        const folderName = `${selectedArtist.name} ${selectedArtist.surname}`;
        const folderPath = `artists/${folderName}/landing`;

        // Initialiser la modale de progression
        setShowProgressModal(true);
        setProgressSteps([
          {
            id: "folder-check",
            label: t("progress.checkingFolder"),
            status: "in-progress",
          },
          {
            id: "conversion",
            label: t("progress.converting"),
            status: "pending",
          },
          {
            id: "upload",
            label: t("progress.uploading"),
            status: "pending",
          },
        ]);
        setProgressError(undefined);

        try {
          // Vérifier/créer le répertoire Firebase
          const folderExists = await ensureFolderExists(
            folderPath,
            selectedArtist.name,
            selectedArtist.surname
          );

          if (!folderExists) {
            setProgressSteps((prev) =>
              prev.map((s) =>
                s.id === "folder-check" ? { ...s, status: "error" } : s
              )
            );
            setProgressError(t("errors.firebaseFolderError"));
            showError(t("errors.firebaseFolderError"));
            setIsSubmitting(false);
            return;
          }

          setProgressSteps((prev) =>
            prev.map((s) =>
              s.id === "folder-check" ? { ...s, status: "completed" } : s
            )
          );

          // Conversion WebP
          setProgressSteps((prev) =>
            prev.map((s) =>
              s.id === "conversion" ? { ...s, status: "in-progress" } : s
            )
          );

          const conversionResult = await convertToWebPIfNeeded(mainImageFile);

          if (!conversionResult.success) {
            throw new Error(
              conversionResult.error || t("errors.webpConversionError")
            );
          }

          setProgressSteps((prev) =>
            prev.map((s) =>
              s.id === "conversion" ? { ...s, status: "completed" } : s
            )
          );

          // Upload vers Firebase
          setProgressSteps((prev) =>
            prev.map((s) =>
              s.id === "upload" ? { ...s, status: "in-progress" } : s
            )
          );

          // Générer un nom de fichier unique basé sur le nom de l'œuvre
          const fileName = normalizeString(
            data.name || `artwork-${Date.now()}`
          );

          finalImageUrl = await uploadImageToLandingFolder(
            conversionResult.file,
            folderName,
            fileName,
            (status, error) => {
              // Callback pour la conversion (déjà géré)
            },
            (status, error) => {
              if (status === "error") {
                setProgressSteps((prev) =>
                  prev.map((s) =>
                    s.id === "upload" ? { ...s, status: "error" } : s
                  )
                );
                setProgressError(error || t("errors.uploadError"));
              }
            }
          );

          setProgressSteps((prev) =>
            prev.map((s) =>
              s.id === "upload" ? { ...s, status: "completed" } : s
            )
          );

          // Mettre à jour le champ du formulaire
          setValue("imageUrl", finalImageUrl);
          setImagePreview(finalImageUrl);

          // Fermer la modale après un court délai
          setTimeout(() => {
            setShowProgressModal(false);
          }, 500);
        } catch (uploadError: any) {
          console.error(
            "Erreur lors de l'upload de l'image principale:",
            uploadError
          );
          setProgressError(
            uploadError.message || t("errors.mainImageUploadError")
          );
          showError(uploadError.message || t("errors.mainImageUploadError"));
          setIsSubmitting(false);
          return;
        }
      }

      // Upload des mockups si des fichiers ont été sélectionnés
      const finalMockupUrls = [...mockupUrls];
      if (mockupFiles.length > 0) {
        setUploadingMockups(mockupFiles.map((_, index) => index));
        try {
          const { getAuth, signInAnonymously } = await import("firebase/auth");
          const { app } = await import("@/lib/firebase/config");

          const auth = getAuth(app);
          await signInAnonymously(auth);

          for (let i = 0; i < mockupFiles.length; i++) {
            const mockup = mockupFiles[i];
            try {
              info(
                t("progress.uploadingMockup", {
                  current: i + 1,
                  total: mockupFiles.length,
                })
              );
              const mockupUrl = await uploadMockupToFirebase(
                mockup.file,
                selectedArtist.name,
                selectedArtist.surname,
                mockup.name || undefined
              );
              finalMockupUrls.push({ name: mockup.name, url: mockupUrl });
            } catch (mockupError: any) {
              console.error(
                `Erreur lors de l'upload du mockup ${i + 1}:`,
                mockupError
              );
              showError(
                t("errors.mockupUploadErrorWithIndex", { index: i + 1 }) +
                  `: ${mockupError.message}`
              );
            }
          }
          success(t("success.mockupsUploaded"));
        } catch (uploadError: any) {
          console.error("Erreur lors de l'upload des mockups:", uploadError);
          showError(t("errors.mockupUploadError"));
        } finally {
          setUploadingMockups([]);
        }
      }

      // Vérifier que finalImageUrl est défini après l'upload
      if (!finalImageUrl) {
        showError(t("errors.imageUrlRequired"));
        setIsSubmitting(false);
        return;
      }

      const formattedPrice =
        data.price && data.price.trim() !== ""
          ? parseFloat(data.price.replace(",", "."))
          : null;
      const formattedWidth =
        data.width && data.width.trim() !== "" ? parseInt(data.width) : null;
      const formattedHeight =
        data.height && data.height.trim() !== "" ? parseInt(data.height) : null;

      if (mode === "create") {
        const result = await createPresaleArtwork({
          name: data.name,
          artistId: parseInt(data.artistId),
          price: formattedPrice,
          imageUrl: finalImageUrl,
          description: data.description,
          width: formattedWidth,
          height: formattedHeight,
          mockupUrls: JSON.stringify(finalMockupUrls),
          isSold: data.isSold ?? false,
        });

        if (result.success) {
          success(t("success.created"));

          // Gestion des traductions pour name et description
          try {
            if (result.presaleArtwork?.id) {
              await handleEntityTranslations(
                "PresaleArtwork",
                result.presaleArtwork.id,
                {
                  name: data.name,
                  description: data.description || null,
                }
              );
            }
          } catch (translationError) {
            console.error(
              "Erreur lors de la gestion des traductions:",
              translationError
            );
            // On ne bloque pas la création en cas d'erreur de traduction
          }

          // Rediriger selon l'URL fournie ou retourner en arrière
          if (redirectUrl) {
            router.push(redirectUrl);
          } else {
            router.back();
          }
        } else {
          showError(result.message || t("errors.createError"));
        }
      } else if (mode === "edit" && presaleArtworkId) {
        const result = await updatePresaleArtwork(presaleArtworkId, {
          name: data.name,
          artistId: parseInt(data.artistId),
          price: formattedPrice,
          imageUrl: finalImageUrl,
          description: data.description,
          width: formattedWidth,
          height: formattedHeight,
          mockupUrls: JSON.stringify(finalMockupUrls),
          isSold: data.isSold ?? false,
        });

        if (result.success) {
          success(t("success.updated"));

          // Gestion des traductions pour name et description
          try {
            await handleEntityTranslations("PresaleArtwork", presaleArtworkId, {
              name: data.name,
              description: data.description || null,
            });
          } catch (translationError) {
            console.error(
              "Erreur lors de la gestion des traductions:",
              translationError
            );
            // On ne bloque pas la mise à jour en cas d'erreur de traduction
          }

          // Rediriger selon l'URL fournie ou retourner en arrière
          if (redirectUrl) {
            router.push(redirectUrl);
          } else {
            router.back();
          }
        } else {
          showError(result.message || t("errors.updateError"));
        }
      }
    } catch (error: any) {
      console.error("Erreur lors de la soumission:", error);
      showError(t("errors.submitError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Gestion de l'upload de l'image principale
  const handleMainImageDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        const validTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
          "image/webp",
        ];
        if (!validTypes.includes(file.type)) {
          showError(t("errors.unsupportedFormat"));
          return;
        }

        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          showError(t("errors.imageTooLarge"));
          return;
        }

        setMainImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      }
    },
    [showError, t]
  );

  const {
    getRootProps: getMainImageRootProps,
    getInputProps: getMainImageInputProps,
    isDragActive: isMainImageDragActive,
  } = useDropzone({
    onDrop: handleMainImageDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    maxFiles: 1,
    multiple: false,
    noClick: false,
    noKeyboard: false,
  });

  const handleRemoveMainImage = () => {
    setMainImageFile(null);
    setImagePreview("");
    setValue("imageUrl", "");
    if (mainImageInputRef.current) {
      mainImageInputRef.current.value = "";
    }
  };

  // Gestion de l'upload des mockups
  const handleMockupDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        const validTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
          "image/webp",
        ];
        if (!validTypes.includes(file.type)) {
          showError(t("errors.unsupportedFormat"));
          return;
        }

        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          showError(t("errors.imageTooLarge"));
          return;
        }

        setMockupFiles([...mockupFiles, { name: newMockupName, file }]);
        setNewMockupName("");
      }
    },
    [showError, t, mockupFiles, newMockupName]
  );

  const {
    getRootProps: getMockupRootProps,
    getInputProps: getMockupInputProps,
    isDragActive: isMockupDragActive,
  } = useDropzone({
    onDrop: handleMockupDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleRemoveMockup = (index: number) => {
    const updatedMockups = [...mockupUrls];
    const updatedFiles = [...mockupFiles];

    // Si c'est un fichier en attente d'upload
    if (index >= mockupUrls.length) {
      updatedFiles.splice(index - mockupUrls.length, 1);
      setMockupFiles(updatedFiles);
    } else {
      // Si c'est une URL existante
      updatedMockups.splice(index, 1);
      setMockupUrls(updatedMockups);
    }
  };

  if (isLoading) {
    return <LoadingSpinner message={t("progress.loading")} />;
  }

  // Déterminer si le champ artiste doit être en lecture seule
  // En mode "edit" avec defaultArtistId, le champ est en lecture seule (page art/presale-artworks/[id]/edit)
  const isArtistReadOnly = !!defaultArtistId && mode === "edit";

  // Surveiller la valeur de isSold pour le toggle switch
  const isSold = watch("isSold") ?? false;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="form-container">
      <div className="form-card">
        <div className="card-content">
          <TranslationField
            entityType="PresaleArtwork"
            entityId={mode === "edit" ? presaleArtworkId || null : null}
            field="name"
            label={
              <>
                {t("fields.name")} <span className="text-danger">*</span>
              </>
            }
            errorMessage={errors.name?.message}
          >
            <input
              id="name"
              type="text"
              {...register("name")}
              className={`form-input ${errors.name ? "input-error" : ""}`}
              placeholder={t("fields.namePlaceholder")}
              disabled={isSubmitting}
            />
          </TranslationField>

          <TranslationField
            entityType="PresaleArtwork"
            entityId={mode === "edit" ? presaleArtworkId || null : null}
            field="description"
            label={t("fields.description")}
            errorMessage={errors.description?.message}
          >
            <textarea
              id="description"
              {...register("description")}
              className={`form-input ${
                errors.description ? "input-error" : ""
              }`}
              placeholder={t("fields.descriptionPlaceholder")}
              rows={3}
              disabled={isSubmitting}
            />
          </TranslationField>

          <div className="form-group">
            <label htmlFor="artistId" className="form-label">
              {t("fields.artist")} <span className="text-danger">*</span>
            </label>
            <select
              id="artistId"
              {...register("artistId")}
              className={`form-select ${errors.artistId ? "input-error" : ""}`}
              disabled={isSubmitting || isArtistReadOnly}
              key={`artist-select-${artists.length}-${defaultArtistId || ""}`}
            >
              <option value="">{t("fields.selectArtist")}</option>
              {artists.map((artist) => (
                <option key={artist.id} value={artist.id.toString()}>
                  {artist.name} {artist.surname}
                </option>
              ))}
            </select>
            {errors.artistId && (
              <p className="form-error">{errors.artistId.message}</p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">
              {t("fields.mainImage")} <span className="text-danger">*</span>
            </label>
            {!imagePreview ? (
              <div className="mb-3">
                <div
                  {...getMainImageRootProps()}
                  style={{
                    border: `2px dashed ${
                      isMainImageDragActive ? "#4dabf7" : "#ccc"
                    }`,
                    borderRadius: "8px",
                    padding: "1.5rem",
                    textAlign: "center",
                    cursor: "pointer",
                    backgroundColor: isMainImageDragActive
                      ? "#f0f8ff"
                      : "#fafafa",
                    transition: "all 0.2s ease",
                  }}
                >
                  <input
                    {...getMainImageInputProps()}
                    ref={mainImageInputRef}
                    id="main-image-input"
                  />
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "0.5rem",
                    }}
                    onClick={(e) => {
                      // Déclencher le clic sur l'input si le clic est sur le contenu
                      e.stopPropagation();
                      const input = document.getElementById(
                        "main-image-input"
                      ) as HTMLInputElement;
                      if (input) {
                        input.click();
                      }
                    }}
                  >
                    <Camera size={24} color="#666" />
                    <p
                      style={{
                        margin: 0,
                        fontSize: "0.875rem",
                        fontWeight: 600,
                      }}
                    >
                      {isMainImageDragActive
                        ? t("fields.dropHere")
                        : t("fields.clickOrDrag")}
                    </p>
                    <p
                      style={{ margin: 0, fontSize: "0.75rem", color: "#666" }}
                    >
                      {t("fields.formats")}
                    </p>
                  </div>
                </div>
              </div>
            ) : null}
            {/* Champ caché pour la validation du formulaire */}
            <input id="imageUrl" type="hidden" {...register("imageUrl")} />
            {imagePreview && (
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "1rem",
                  marginTop: "1rem",
                }}
              >
                <div
                  style={{
                    position: "relative",
                    width: "200px",
                    height: "200px",
                    borderRadius: "8px",
                    overflow: "hidden",
                  }}
                >
                  <Image
                    src={imagePreview}
                    alt={t("fields.imagePreview")}
                    fill
                    style={{ objectFit: "cover" }}
                  />
                  <button
                    type="button"
                    onClick={handleRemoveMainImage}
                    style={{
                      position: "absolute",
                      top: "8px",
                      right: "8px",
                      background: "rgba(0, 0, 0, 0.7)",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "4px 8px",
                      cursor: "pointer",
                      fontSize: "12px",
                      zIndex: 10,
                    }}
                    disabled={isSubmitting || uploadingMainImage}
                  >
                    ✕ {t("fields.remove")}
                  </button>
                  {uploadingMainImage && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "8px",
                        left: "8px",
                        right: "8px",
                        background: "rgba(0, 0, 0, 0.7)",
                        color: "white",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "12px",
                        textAlign: "center",
                        zIndex: 10,
                      }}
                    >
                      {t("fields.uploading")}
                    </div>
                  )}
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.5rem",
                    paddingTop: "0.5rem",
                  }}
                >
                  <label
                    className="form-label"
                    style={{ marginBottom: "0.5rem" }}
                  >
                    {t("fields.isSold") || "Statut de vente"}
                  </label>
                  <div className="d-flex align-items-center gap-md">
                    <span
                      className={!isSold ? "text-primary" : "text-muted"}
                      style={{ fontWeight: !isSold ? "bold" : "normal" }}
                    >
                      {t("fields.notSold") || "Non vendu"}
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
                        {...register("isSold")}
                        disabled={isSubmitting}
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
                          backgroundColor: isSold ? "#4f46e5" : "#ccc",
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
                            transform: isSold
                              ? "translateX(30px)"
                              : "translateX(0)",
                          }}
                        ></span>
                      </span>
                    </label>
                    <span
                      className={isSold ? "text-primary" : "text-muted"}
                      style={{ fontWeight: isSold ? "bold" : "normal" }}
                    >
                      {t("fields.sold") || "Vendu"}
                    </span>
                  </div>
                  {errors.isSold && (
                    <p
                      className="form-error"
                      style={{ fontSize: "0.75rem", margin: 0 }}
                    >
                      {errors.isSold.message}
                    </p>
                  )}
                </div>
              </div>
            )}
            {errors.imageUrl && (
              <p className="form-error">{errors.imageUrl.message}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="price" className="form-label">
              {t("fields.price")}
            </label>
            <input
              id="price"
              type="text"
              {...register("price")}
              className={`form-input ${errors.price ? "input-error" : ""}`}
              placeholder={t("fields.pricePlaceholder")}
              disabled={isSubmitting}
            />
            {errors.price && (
              <p className="form-error">{errors.price.message}</p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">{t("fields.dimensions")}</label>
            <div className="d-flex gap-sm">
              <div style={{ flex: 1 }}>
                <label htmlFor="width" className="form-label">
                  {t("fields.width")}
                </label>
                <input
                  id="width"
                  type="number"
                  min="0"
                  step="1"
                  {...register("width")}
                  className={`form-input ${errors.width ? "input-error" : ""}`}
                  placeholder={t("fields.widthPlaceholder")}
                  disabled={isSubmitting}
                />
                {errors.width && (
                  <p className="form-error">{errors.width.message}</p>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="height" className="form-label">
                  {t("fields.height")}
                </label>
                <input
                  id="height"
                  type="number"
                  min="0"
                  step="1"
                  {...register("height")}
                  className={`form-input ${errors.height ? "input-error" : ""}`}
                  placeholder={t("fields.heightPlaceholder")}
                  disabled={isSubmitting}
                />
                {errors.height && (
                  <p className="form-error">{errors.height.message}</p>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {t("fields.dimensionsNote")}
            </p>
          </div>

          {/* Section mockups masquée temporairement */}
          <div className="form-group" style={{ display: "none" }}>
            <label className="form-label">{t("fields.mockups")}</label>
            <div className="d-flex gap-sm mb-3">
              <div style={{ flex: 1 }}>
                <label htmlFor="newMockupName" className="form-label">
                  {t("fields.mockupName")}
                </label>
                <input
                  id="newMockupName"
                  type="text"
                  value={newMockupName}
                  onChange={(e) => setNewMockupName(e.target.value)}
                  className="form-input"
                  placeholder={t("fields.mockupNamePlaceholder")}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div
              {...getMockupRootProps()}
              style={{
                border: `2px dashed ${isMockupDragActive ? "#4dabf7" : "#ccc"}`,
                borderRadius: "8px",
                padding: "1.5rem",
                textAlign: "center",
                cursor: "pointer",
                backgroundColor: isMockupDragActive ? "#f0f8ff" : "#fafafa",
                transition: "all 0.2s ease",
                marginBottom: "1rem",
              }}
            >
              <input {...getMockupInputProps()} />
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "0.5rem",
                }}
              >
                <Camera size={24} color="#666" />
                <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600 }}>
                  {isMockupDragActive
                    ? t("fields.dropMockupHere")
                    : t("fields.clickOrDragMockup")}
                </p>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "#666" }}>
                  {t("fields.formats")}
                </p>
              </div>
            </div>

            <div className="mockup-list mt-3">
              {mockupUrls.length === 0 && mockupFiles.length === 0 ? (
                <p className="text-xs text-gray-500">{t("fields.noMockup")}</p>
              ) : (
                <div className="d-flex flex-wrap gap-2 mt-2">
                  {mockupUrls.map((mockup, index) => (
                    <div
                      key={`url-${index}`}
                      className="mockup-item"
                      style={{ position: "relative", width: "120px" }}
                    >
                      <div
                        style={{
                          position: "relative",
                          width: "120px",
                          height: "120px",
                          borderRadius: "4px",
                          overflow: "hidden",
                        }}
                      >
                        <Image
                          src={mockup.url}
                          alt={mockup.name || `Mockup ${index + 1}`}
                          fill
                          style={{ objectFit: "cover" }}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                          }}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveMockup(index)}
                        className="btn btn-danger btn-small"
                        style={{
                          position: "absolute",
                          top: "4px",
                          right: "4px",
                          padding: "2px",
                          borderRadius: "50%",
                        }}
                        aria-label={t("fields.removeMockup")}
                        disabled={isSubmitting}
                      >
                        <X size={14} />
                      </button>
                      {mockup.name && (
                        <p
                          className="text-xs text-gray-700 mt-1"
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: "120px",
                          }}
                        >
                          {mockup.name}
                        </p>
                      )}
                    </div>
                  ))}
                  {mockupFiles.map((mockup, index) => {
                    const previewUrl = URL.createObjectURL(mockup.file);
                    const isUploading = uploadingMockups.includes(index);
                    return (
                      <div
                        key={`file-${index}`}
                        className="mockup-item"
                        style={{ position: "relative", width: "120px" }}
                      >
                        <div
                          style={{
                            position: "relative",
                            width: "120px",
                            height: "120px",
                            borderRadius: "4px",
                            overflow: "hidden",
                          }}
                        >
                          <Image
                            src={previewUrl}
                            alt={mockup.name || `Mockup ${index + 1}`}
                            fill
                            style={{ objectFit: "cover" }}
                            onError={(e) => {
                              e.currentTarget.style.display = "none";
                            }}
                          />
                          {isUploading && (
                            <div
                              style={{
                                position: "absolute",
                                bottom: 0,
                                left: 0,
                                right: 0,
                                background: "rgba(0, 0, 0, 0.7)",
                                color: "white",
                                padding: "4px",
                                fontSize: "10px",
                                textAlign: "center",
                              }}
                            >
                              Upload...
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            handleRemoveMockup(mockupUrls.length + index)
                          }
                          className="btn btn-danger btn-small"
                          style={{
                            position: "absolute",
                            top: "4px",
                            right: "4px",
                            padding: "2px",
                            borderRadius: "50%",
                          }}
                          aria-label={t("fields.removeMockup")}
                          disabled={isSubmitting || isUploading}
                        >
                          <X size={14} />
                        </button>
                        {mockup.name && (
                          <p
                            className="text-xs text-gray-700 mt-1"
                            style={{
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              maxWidth: "120px",
                            }}
                          >
                            {mockup.name}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ProgressModal
        isOpen={showProgressModal}
        steps={progressSteps}
        currentError={progressError}
        title={t("progress.creating")}
        onClose={() => {
          if (progressError) {
            setShowProgressModal(false);
            setProgressError(undefined);
          }
        }}
      />

      <div className="form-actions">
        <button
          type="button"
          onClick={handleCancel}
          className="btn btn-secondary btn-medium"
          disabled={isSubmitting}
        >
          {t("buttons.cancel")}
        </button>
        <button
          type="submit"
          className="btn btn-primary btn-medium"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <LoadingSpinner size="small" message="" inline />
              {mode === "create"
                ? t("buttons.creating")
                : t("buttons.updating")}
            </>
          ) : mode === "create" ? (
            t("buttons.create")
          ) : (
            t("buttons.update")
          )}
        </button>
      </div>
    </form>
  );
}
