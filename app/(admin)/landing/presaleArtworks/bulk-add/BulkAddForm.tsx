"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { useToast } from "@/app/components/Toast/ToastContext";
import LoadingSpinner from "@/app/components/LoadingSpinner/LoadingSpinner";
import BulkArtworkTable from "./BulkArtworkTable";
import { createBulkPresaleArtworks } from "@/lib/actions/presale-artwork-actions";
import { handleEntityTranslations } from "@/lib/actions/translation-actions";
import ProgressModal from "@/app/components/art/ProgressModal";
import {
  ensureFolderExists,
  uploadImageToLandingFolder,
} from "@/lib/firebase/storage";
import { normalizeString } from "@/lib/utils";

// Fonction pour créer le schéma de validation avec traductions
const createBulkAddSchema = (t: (key: string) => string) =>
  z.object({
    artistId: z.string().min(1, t("validation.artistRequired")),
    numberOfArtworks: z
      .string()
      .min(1, t("validation.numberRequired"))
      .refine((val) => {
        const num = parseInt(val);
        return !isNaN(num) && num > 0 && num <= 50;
      }, t("validation.numberRange")),
    defaultPrice: z.string().optional(),
    defaultHeight: z.string().optional(),
    defaultWidth: z.string().optional(),
  });

type BulkAddFormValues = {
  artistId: string;
  numberOfArtworks: string;
  defaultPrice?: string;
  defaultHeight?: string;
  defaultWidth?: string;
};

// Schéma de validation pour chaque œuvre
export const artworkSchema = z
  .object({
    name: z.string().min(1, "Le nom est requis"),
    description: z.string().optional(),
    height: z.string().optional(),
    width: z.string().optional(),
    price: z.string().optional(),
    imageFile: z.instanceof(File).optional(),
    imageUrl: z.string().optional(),
  })
  .refine((data) => data.imageFile || data.imageUrl, {
    message: "Une image est requise (fichier ou URL)",
    path: ["imageFile"],
  });

export type ArtworkData = {
  name: string;
  description: string;
  height: string;
  width: string;
  price: string;
  imageFile?: File | null;
  imageUrl?: string;
};

interface Artist {
  id: number;
  name: string;
  surname: string;
}

interface BulkAddFormProps {
  artists: Artist[];
  /**
   * ID de l'artiste à pré-sélectionner (pour les artistes connectés)
   * Si fourni, le champ artiste sera en lecture seule
   */
  defaultArtistId?: number;
  /**
   * URL de redirection après annulation (par défaut: /landing/presaleArtworks)
   */
  cancelRedirectUrl?: string;
  /**
   * URL de redirection après succès (par défaut: /landing/presaleArtworks)
   */
  successRedirectUrl?: string;
}

export default function BulkAddForm({
  artists,
  defaultArtistId,
  cancelRedirectUrl = "/landing/presaleArtworks",
  successRedirectUrl = "/landing/presaleArtworks",
}: BulkAddFormProps) {
  const router = useRouter();
  const t = useTranslations("art.bulkAddPage.form");
  const tTable = useTranslations("art.bulkAddPage.table");
  const tProgress = useTranslations("art.progressModal");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showTable, setShowTable] = useState(false);
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [numberOfArtworks, setNumberOfArtworks] = useState(0);
  const [artworksData, setArtworksData] = useState<ArtworkData[]>([]);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [currentArtworkIndex, setCurrentArtworkIndex] = useState<number | null>(
    null
  );
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
  const { success, error } = useToast();

  // Créer le schéma avec les traductions
  const bulkAddSchema = createBulkAddSchema(t);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<BulkAddFormValues>({
    resolver: zodResolver(bulkAddSchema),
    defaultValues: {
      artistId: defaultArtistId ? defaultArtistId.toString() : "",
      numberOfArtworks: "",
    },
  });

  // Pré-sélectionner l'artiste si defaultArtistId est fourni
  useEffect(() => {
    if (defaultArtistId) {
      setValue("artistId", defaultArtistId.toString());
      const artist = artists.find((a) => a.id === defaultArtistId);
      if (artist) {
        setSelectedArtist(artist);
      }
    }
  }, [defaultArtistId, artists, setValue]);

  const onSubmit = (data: BulkAddFormValues) => {
    const artist = artists.find((a) => a.id.toString() === data.artistId);
    if (!artist) {
      error(t("errors.artistNotFound"));
      return;
    }

    const count = parseInt(data.numberOfArtworks);
    setSelectedArtist(artist);
    setNumberOfArtworks(count);

    // Initialiser les données des œuvres avec les valeurs par défaut ou vides
    const initialArtworks: ArtworkData[] = Array.from(
      { length: count },
      () => ({
        name: "",
        description: "",
        height: data.defaultHeight || "",
        width: data.defaultWidth || "",
        price: data.defaultPrice || "",
        imageFile: null,
        imageUrl: "",
      })
    );

    setArtworksData(initialArtworks);
    setShowTable(true);
  };

  const handleCancel = () => {
    router.push(cancelRedirectUrl);
  };

  const handleBackToForm = () => {
    setShowTable(false);
    setSelectedArtist(null);
    setNumberOfArtworks(0);
    setArtworksData([]);
  };

  const handleArtworksDataChange = (newData: ArtworkData[]) => {
    setArtworksData(newData);
  };

  const handleSave = async () => {
    setIsSubmitting(true);

    // Valider toutes les œuvres
    const validationResults = artworksData.map((artwork, index) => {
      const errors: string[] = [];

      if (!artwork.name.trim()) {
        errors.push(t("validation.nameRequired"));
      }

      if (!artwork.imageFile && !artwork.imageUrl) {
        errors.push(t("validation.imageRequired"));
      }

      if (artwork.price && artwork.price.trim()) {
        const price = parseFloat(artwork.price.replace(",", "."));
        if (isNaN(price) || price < 0) {
          errors.push(t("validation.pricePositive"));
        }
      }

      if (artwork.width && artwork.width.trim()) {
        const width = parseInt(artwork.width);
        if (isNaN(width) || width <= 0) {
          errors.push(t("validation.widthPositive"));
        }
      }

      if (artwork.height && artwork.height.trim()) {
        const height = parseInt(artwork.height);
        if (isNaN(height) || height <= 0) {
          errors.push(t("validation.heightPositive"));
        }
      }

      return {
        valid: errors.length === 0,
        index,
        errors,
      };
    });

    const invalidArtworks = validationResults.filter((result) => !result.valid);

    if (invalidArtworks.length > 0) {
      error(
        t("errors.correctErrors", {
          artworks: invalidArtworks.map((a) => a.index + 1).join(", "),
        })
      );
      setIsSubmitting(false);
      return;
    }

    if (!selectedArtist) {
      error(t("errors.noArtistSelected"));
      setIsSubmitting(false);
      return;
    }

    try {
      // Préparer le nom du répertoire Firebase
      const folderName = `${selectedArtist.name} ${selectedArtist.surname}`;
      const folderPath = `artists/${folderName}/landing`;

      // Vérifier/créer le répertoire Firebase
      setShowProgressModal(true);
      setProgressSteps([
        {
          id: "folder-check",
          label: t("progress.folderCheck"),
          status: "in-progress",
        },
        { id: "upload", label: t("progress.upload"), status: "pending" },
        { id: "creation", label: t("progress.creation"), status: "pending" },
        {
          id: "translation",
          label: t("progress.translation"),
          status: "pending",
        },
      ]);
      setProgressError(undefined);

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
        setProgressError(t("errors.folderError"));
        error(t("errors.folderError"));
        setIsSubmitting(false);
        return;
      }

      setProgressSteps((prev) =>
        prev.map((s) =>
          s.id === "folder-check" ? { ...s, status: "completed" } : s
        )
      );

      // Uploader les images et préparer les données
      const artworksToCreate: Array<{
        name: string;
        description?: string;
        price: number | null;
        imageUrl: string;
        width: number | null;
        height: number | null;
      }> = [];

      setProgressSteps((prev) =>
        prev.map((s) =>
          s.id === "upload" ? { ...s, status: "in-progress" } : s
        )
      );

      for (let i = 0; i < artworksData.length; i++) {
        const artwork = artworksData[i];
        setCurrentArtworkIndex(i);

        let imageUrl = artwork.imageUrl || "";

        // Si un fichier est fourni, l'uploader
        if (artwork.imageFile) {
          try {
            // Générer un nom de fichier unique basé sur le nom de l'œuvre
            const fileName = normalizeString(
              artwork.name || `artwork-${Date.now()}-${i}`
            );

            imageUrl = await uploadImageToLandingFolder(
              artwork.imageFile,
              folderName,
              fileName,
              (status, error) => {
                // Callback pour la conversion (non utilisé dans la modale actuelle)
              },
              (status, error) => {
                // Callback pour l'upload (non utilisé dans la modale actuelle)
              }
            );
          } catch (uploadError) {
            console.error(
              `Erreur lors de l'upload de l'image pour l'œuvre ${i + 1}:`,
              uploadError
            );
            setProgressSteps((prev) =>
              prev.map((s) =>
                s.id === "upload" ? { ...s, status: "error" } : s
              )
            );
            setProgressError(t("errors.uploadError", { index: i + 1 }));
            error(t("errors.uploadError", { index: i + 1 }));
            setIsSubmitting(false);
            return;
          }
        }

        if (!imageUrl) {
          setProgressSteps((prev) =>
            prev.map((s) => (s.id === "upload" ? { ...s, status: "error" } : s))
          );
          setProgressError(t("errors.noImage", { index: i + 1 }));
          error(t("errors.noImage", { index: i + 1 }));
          setIsSubmitting(false);
          return;
        }

        artworksToCreate.push({
          name: artwork.name,
          description: artwork.description || undefined,
          price:
            artwork.price && artwork.price.trim() !== ""
              ? parseFloat(artwork.price.replace(",", "."))
              : null,
          imageUrl,
          width:
            artwork.width && artwork.width.trim() !== ""
              ? parseInt(artwork.width)
              : null,
          height:
            artwork.height && artwork.height.trim() !== ""
              ? parseInt(artwork.height)
              : null,
        });
      }

      setCurrentArtworkIndex(null);
      setProgressSteps((prev) =>
        prev.map((s) => (s.id === "upload" ? { ...s, status: "completed" } : s))
      );

      // Créer les œuvres en masse
      setProgressSteps((prev) =>
        prev.map((s) =>
          s.id === "creation" ? { ...s, status: "in-progress" } : s
        )
      );

      const result = await createBulkPresaleArtworks({
        artistId: selectedArtist.id,
        artworks: artworksToCreate,
      });

      if (!result.success) {
        setProgressSteps((prev) =>
          prev.map((s) => (s.id === "creation" ? { ...s, status: "error" } : s))
        );
        setProgressError(result.message || t("errors.creationError"));
        error(result.message || t("errors.creationError"));
        setIsSubmitting(false);
        return;
      }

      setProgressSteps((prev) =>
        prev.map((s) =>
          s.id === "creation" ? { ...s, status: "completed" } : s
        )
      );

      // Gérer les traductions pour chaque œuvre créée
      setProgressSteps((prev) =>
        prev.map((s) =>
          s.id === "translation" ? { ...s, status: "in-progress" } : s
        )
      );

      try {
        for (let i = 0; i < result.artworks!.length; i++) {
          const createdArtwork = result.artworks![i];
          const originalData = artworksData[i];

          await handleEntityTranslations("PresaleArtwork", createdArtwork.id, {
            name: originalData.name,
            description: originalData.description || null,
          });
        }

        setProgressSteps((prev) =>
          prev.map((s) =>
            s.id === "translation" ? { ...s, status: "completed" } : s
          )
        );
      } catch (translationError) {
        console.error(
          "Erreur lors de la gestion des traductions:",
          translationError
        );
        setProgressSteps((prev) =>
          prev.map((s) =>
            s.id === "translation" ? { ...s, status: "error" } : s
          )
        );
        // On ne bloque pas la création en cas d'erreur de traduction
      }

      const count = result.count!;
      success(
        count > 1
          ? t("success.createdPlural", { count })
          : t("success.created", { count })
      );

      // Fermer la modale après un court délai
      setTimeout(() => {
        setShowProgressModal(false);
        router.push(successRedirectUrl);
      }, 1000);
    } catch (err) {
      console.error("Erreur lors de l'enregistrement:", err);
      setProgressError(t("errors.saveError"));
      error(t("errors.saveError"));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showTable && selectedArtist) {
    return (
      <div className="page-container">
        <div className="page-header">
          <h1 className="page-title">
            {t("dataEntryTitle", {
              artistName: `${selectedArtist.name} ${selectedArtist.surname}`,
            })}
          </h1>
          <p className="page-subtitle">
            {numberOfArtworks > 1
              ? t("artworksToCreatePlural", { count: numberOfArtworks })
              : t("artworksToCreate", { count: numberOfArtworks })}
          </p>
        </div>

        <BulkArtworkTable
          artworksData={artworksData}
          onDataChange={handleArtworksDataChange}
          isSubmitting={isSubmitting}
        />

        <ProgressModal
          isOpen={showProgressModal}
          steps={progressSteps}
          currentError={progressError}
          title={t("creationTitle")}
          onClose={() => {
            if (progressError) {
              setShowProgressModal(false);
              setProgressError(undefined);
            }
          }}
        />

        {currentArtworkIndex !== null && (
          <div className="fixed bottom-4 right-4 bg-blue-500 text-white px-4 py-2 rounded shadow-lg">
            {t("uploadProgress", {
              current: currentArtworkIndex + 1,
              total: artworksData.length,
            })}
          </div>
        )}

        <div className="form-actions">
          <button
            type="button"
            onClick={handleBackToForm}
            className="btn btn-secondary btn-medium"
            disabled={isSubmitting}
          >
            {t("back")}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn btn-primary btn-medium"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="small" message="" inline />
                {t("saving")}
              </>
            ) : (
              t("save")
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <h1 className="page-title">{t("title")}</h1>
        <p className="page-subtitle">{t("subtitle")}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="form-container">
        <div className="form-card">
          <div className="card-content">
            <h2 className="form-title">{t("sectionTitle")}</h2>

            <div className="form-group">
              <label htmlFor="artistId" className="form-label">
                {t("artistLabel")} <span className="text-danger">*</span>
              </label>
              <select
                id="artistId"
                {...register("artistId")}
                className={`form-select ${
                  errors.artistId ? "input-error" : ""
                }`}
                disabled={isSubmitting || !!defaultArtistId}
              >
                <option value="">{t("selectArtist")}</option>
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
              <label htmlFor="numberOfArtworks" className="form-label">
                {t("numberOfArtworksLabel")}{" "}
                <span className="text-danger">*</span>
              </label>
              <input
                id="numberOfArtworks"
                type="number"
                min="1"
                max="50"
                {...register("numberOfArtworks")}
                className={`form-input ${
                  errors.numberOfArtworks ? "input-error" : ""
                }`}
                placeholder={t("numberOfArtworksPlaceholder")}
                disabled={isSubmitting}
              />
              {errors.numberOfArtworks && (
                <p className="form-error">{errors.numberOfArtworks.message}</p>
              )}
              <p className="text-xs text-text-secondary mt-1">
                {t("maxArtworks")}
              </p>
            </div>

            <div className="form-group">
              <label htmlFor="defaultPrice" className="form-label">
                {t("defaultPriceLabel")}
              </label>
              <input
                id="defaultPrice"
                type="text"
                {...register("defaultPrice")}
                className="form-input"
                placeholder={t("defaultPricePlaceholder")}
                disabled={isSubmitting}
              />
              <p className="text-xs text-text-secondary mt-1">
                {t("defaultPriceHelper")}
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">
                {t("defaultDimensionsLabel")}
              </label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="defaultHeight" className="text-xs text-text-secondary">
                    {t("heightLabel")}
                  </label>
                  <input
                    id="defaultHeight"
                    type="number"
                    min="1"
                    {...register("defaultHeight")}
                    className="form-input"
                    placeholder={t("heightPlaceholder")}
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label htmlFor="defaultWidth" className="text-xs text-text-secondary">
                    {t("widthLabel")}
                  </label>
                  <input
                    id="defaultWidth"
                    type="number"
                    min="1"
                    {...register("defaultWidth")}
                    className="form-input"
                    placeholder={t("widthPlaceholder")}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              <p className="text-xs text-text-secondary mt-1">
                {t("defaultDimensionsHelper")}
              </p>
            </div>
          </div>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={handleCancel}
            className="btn btn-secondary btn-medium"
            disabled={isSubmitting}
          >
            {t("cancel")}
          </button>
          <button
            type="submit"
            className="btn btn-primary btn-medium"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <LoadingSpinner size="small" message="" inline />
                {t("validating")}
              </>
            ) : (
              t("validate")
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
