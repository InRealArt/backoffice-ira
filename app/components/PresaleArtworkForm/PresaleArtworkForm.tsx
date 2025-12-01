"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import ProgressModal from "@/app/(protected)/art/create-artist-profile/ProgressModal";

// Schéma de validation
const presaleArtworkSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  artistId: z.string().min(1, "Veuillez sélectionner un artiste"),
  imageUrl: z.string().optional(), // Sera validé manuellement si un fichier est uploadé
  description: z.string().optional(),
  price: z.string().optional(),
  width: z.string().optional(),
  height: z.string().optional(),
});

type PresaleArtworkFormValues = z.infer<typeof presaleArtworkSchema>;

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

function ImageThumbnail({ url }: { url: string }) {
  return (
    <div className="inline-flex items-center">
      <div className="relative w-6 h-6 mr-1">
        <Image
          src={url}
          alt="Miniature"
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
  const { success, error, info } = useToast();

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
    resolver: zodResolver(presaleArtworkSchema),
    defaultValues: {
      name: "",
      artistId: defaultArtistId ? defaultArtistId.toString() : "",
      price: "",
      imageUrl: "",
      description: "",
      width: "",
      height: "",
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
        error("Erreur lors de la récupération des artistes");
      }
    };

    fetchArtists();
  }, [error]);

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
            error("Œuvre en prévente non trouvée");
            router.push(redirectUrl || "/landing/presaleArtworks");
          }
        } catch (error: any) {
          console.error(
            "Erreur lors de la récupération de l'œuvre en prévente:",
            error
          );
          error("Erreur lors de la récupération de l'œuvre en prévente");
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    fetchPresaleArtwork();
  }, [mode, presaleArtworkId, setValue, router, redirectUrl, error]);

  const onSubmit = async (data: PresaleArtworkFormValues) => {
    setIsSubmitting(true);

    try {
      // Récupérer les informations de l'artiste sélectionné
      const selectedArtist = artists.find(
        (a) => a.id.toString() === data.artistId
      );
      if (!selectedArtist) {
        error("Veuillez sélectionner un artiste");
        setIsSubmitting(false);
        return;
      }

      // Validation manuelle : vérifier qu'une image est fournie (soit URL, soit fichier)
      if (!mainImageFile && !data.imageUrl) {
        error("Veuillez uploader une image ou fournir une URL d'image");
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
            label: "Vérification du répertoire Firebase",
            status: "in-progress",
          },
          {
            id: "conversion",
            label: "Conversion de l'image en WebP",
            status: "pending",
          },
          {
            id: "upload",
            label: "Upload vers Firebase",
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
            setProgressError("Impossible de créer le répertoire Firebase");
            error("Impossible de créer le répertoire Firebase");
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
              conversionResult.error || "Erreur lors de la conversion WebP"
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
                setProgressError(error || "Erreur lors de l'upload");
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
            uploadError.message ||
              "Erreur lors de l'upload de l'image principale"
          );
          error(
            uploadError.message ||
              "Erreur lors de l'upload de l'image principale"
          );
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
              info(`Upload du mockup ${i + 1}/${mockupFiles.length}...`);
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
              error(
                `Erreur lors de l'upload du mockup ${i + 1}: ${
                  mockupError.message
                }`
              );
            }
          }
          success("Mockups uploadés avec succès");
        } catch (uploadError: any) {
          console.error("Erreur lors de l'upload des mockups:", uploadError);
          error("Erreur lors de l'upload des mockups");
        } finally {
          setUploadingMockups([]);
        }
      }

      // Vérifier que finalImageUrl est défini après l'upload
      if (!finalImageUrl) {
        error(
          "L'URL de l'image est requise. Veuillez uploader une image ou fournir une URL."
        );
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
        });

        if (result.success) {
          success("Œuvre en prévente créée avec succès");

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
          error(
            result.message ||
              "Erreur lors de la création de l'œuvre en prévente"
          );
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
        });

        if (result.success) {
          success("Œuvre en prévente mise à jour avec succès");

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
          error(
            result.message ||
              "Erreur lors de la mise à jour de l'œuvre en prévente"
          );
        }
      }
    } catch (error: any) {
      console.error("Erreur lors de la soumission:", error);
      error("Une erreur est survenue");
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
          error("Format non supporté. Utilisez JPEG, PNG, GIF ou WebP");
          return;
        }

        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          error("L'image est trop volumineuse (max 10MB)");
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
    [error]
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
          error("Format non supporté. Utilisez JPEG, PNG, GIF ou WebP");
          return;
        }

        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          error("L'image est trop volumineuse (max 10MB)");
          return;
        }

        setMockupFiles([...mockupFiles, { name: newMockupName, file }]);
        setNewMockupName("");
      }
    },
    [error, mockupFiles, newMockupName]
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
    return <LoadingSpinner message="Chargement des données..." />;
  }

  // Déterminer si le champ artiste doit être en lecture seule
  const isArtistReadOnly = !!defaultArtistId && mode === "create";

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
                Nom de l'œuvre <span className="text-danger">*</span>
              </>
            }
            errorMessage={errors.name?.message}
          >
            <input
              id="name"
              type="text"
              {...register("name")}
              className={`form-input ${errors.name ? "input-error" : ""}`}
              placeholder="Ex: La Joconde, Les Tournesols..."
              disabled={isSubmitting}
            />
          </TranslationField>

          <TranslationField
            entityType="PresaleArtwork"
            entityId={mode === "edit" ? presaleArtworkId || null : null}
            field="description"
            label="Description"
            errorMessage={errors.description?.message}
          >
            <textarea
              id="description"
              {...register("description")}
              className={`form-input ${
                errors.description ? "input-error" : ""
              }`}
              placeholder="Description de l'œuvre..."
              rows={3}
              disabled={isSubmitting}
            />
          </TranslationField>

          <div className="form-group">
            <label htmlFor="artistId" className="form-label">
              Artiste <span className="text-danger">*</span>
            </label>
            <select
              id="artistId"
              {...register("artistId")}
              className={`form-select ${errors.artistId ? "input-error" : ""}`}
              disabled={isSubmitting || isArtistReadOnly}
              key={`artist-select-${artists.length}-${defaultArtistId || ""}`}
            >
              <option value="">Sélectionnez un artiste</option>
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
              Image principale <span className="text-danger">*</span>
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
                        ? "Déposez votre image ici..."
                        : "Cliquez ou glissez-déposez votre image"}
                    </p>
                    <p
                      style={{ margin: 0, fontSize: "0.75rem", color: "#666" }}
                    >
                      Formats: JPEG, PNG, GIF, WebP (max 10MB)
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
                  position: "relative",
                  width: "200px",
                  height: "200px",
                  borderRadius: "8px",
                  overflow: "hidden",
                  marginTop: "1rem",
                }}
              >
                <Image
                  src={imagePreview}
                  alt="Aperçu de l'image"
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
                  ✕ Supprimer
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
                    Upload en cours...
                  </div>
                )}
              </div>
            )}
            {errors.imageUrl && (
              <p className="form-error">{errors.imageUrl.message}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="price" className="form-label">
              Prix (€)
            </label>
            <input
              id="price"
              type="text"
              {...register("price")}
              className={`form-input ${errors.price ? "input-error" : ""}`}
              placeholder="Ex: 1500"
              disabled={isSubmitting}
            />
            {errors.price && (
              <p className="form-error">{errors.price.message}</p>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Dimensions (cm)</label>
            <div className="d-flex gap-sm">
              <div style={{ flex: 1 }}>
                <label htmlFor="width" className="form-label">
                  Largeur
                </label>
                <input
                  id="width"
                  type="number"
                  min="0"
                  step="1"
                  {...register("width")}
                  className={`form-input ${errors.width ? "input-error" : ""}`}
                  placeholder="Ex: 50"
                  disabled={isSubmitting}
                />
                {errors.width && (
                  <p className="form-error">{errors.width.message}</p>
                )}
              </div>
              <div style={{ flex: 1 }}>
                <label htmlFor="height" className="form-label">
                  Hauteur
                </label>
                <input
                  id="height"
                  type="number"
                  min="0"
                  step="1"
                  {...register("height")}
                  className={`form-input ${errors.height ? "input-error" : ""}`}
                  placeholder="Ex: 70"
                  disabled={isSubmitting}
                />
                {errors.height && (
                  <p className="form-error">{errors.height.message}</p>
                )}
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Dimensions en centimètres (optionnel)
            </p>
          </div>

          {/* Section mockups masquée temporairement */}
          <div className="form-group" style={{ display: "none" }}>
            <label className="form-label">URLs des mockups</label>
            <div className="d-flex gap-sm mb-3">
              <div style={{ flex: 1 }}>
                <label htmlFor="newMockupName" className="form-label">
                  Nom du mockup (optionnel)
                </label>
                <input
                  id="newMockupName"
                  type="text"
                  value={newMockupName}
                  onChange={(e) => setNewMockupName(e.target.value)}
                  className="form-input"
                  placeholder="Nom du mockup"
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
                    ? "Déposez votre mockup ici..."
                    : "Cliquez ou glissez-déposez un mockup"}
                </p>
                <p style={{ margin: 0, fontSize: "0.75rem", color: "#666" }}>
                  Formats: JPEG, PNG, GIF, WebP (max 10MB)
                </p>
              </div>
            </div>

            <div className="mockup-list mt-3">
              {mockupUrls.length === 0 && mockupFiles.length === 0 ? (
                <p className="text-xs text-gray-500">Aucun mockup ajouté</p>
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
                        aria-label="Supprimer le mockup"
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
                          aria-label="Supprimer le mockup"
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
        title="Création de l'œuvre en prévente"
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
          Annuler
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
                ? "Création en cours..."
                : "Mise à jour en cours..."}
            </>
          ) : mode === "create" ? (
            "Créer l'œuvre"
          ) : (
            "Mettre à jour l'œuvre"
          )}
        </button>
      </div>
    </form>
  );
}
