"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { Camera, X, Loader2 } from "lucide-react";
import { uploadImageToMarketplaceFolder } from "@/lib/firebase/storage";
import { normalizeString } from "@/lib/utils";
import { useToast } from "@/app/components/Toast/ToastContext";

interface FirebaseImageUploadProps {
  onImageUploaded: (imageUrl: string) => void;
  previewUrl?: string | null;
  error?: string;
  disabled?: boolean;
  artistName: string;
  artistSurname: string;
  artworkName: string;
}

export default function FirebaseImageUpload({
  onImageUploaded,
  previewUrl,
  error,
  disabled = false,
  artistName,
  artistSurname,
  artworkName,
}: FirebaseImageUploadProps) {
  const [localPreview, setLocalPreview] = useState<string | null>(
    previewUrl || null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { error: errorToast } = useToast();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (!file) return;

      const validTypes = [
        "image/jpeg",
        "image/jpg",
        "image/png",
        "image/gif",
        "image/webp",
      ];
      if (!validTypes.includes(file.type)) {
        const errorMsg = "Format non supporté. Utilisez JPEG, PNG, GIF ou WebP";
        setUploadError(errorMsg);
        errorToast(errorMsg);
        return;
      }

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        const errorMsg = "L'image est trop volumineuse (max 10MB)";
        setUploadError(errorMsg);
        errorToast(errorMsg);
        return;
      }

      setUploadError(null);
      setIsUploading(true);

      try {
        // Créer le nom du répertoire avec la casse exacte (Prenom Nom)
        const folderName = `${artistName} ${artistSurname}`
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "") // Supprime les accents
          .replace(/[^a-zA-Z0-9\s]+/g, "") // Supprime les caractères spéciaux sauf espaces
          .trim();

        // Normaliser le nom de l'œuvre pour le nom de fichier
        const fileName = normalizeString(
          artworkName || `artwork-${Date.now()}`
        );

        // Upload vers Firebase
        const imageUrl = await uploadImageToMarketplaceFolder(
          file,
          folderName,
          fileName,
          (status, error) => {
            if (status === "error") {
              setUploadError(error || "Erreur lors de la conversion");
            }
          },
          (status, error) => {
            if (status === "error") {
              setUploadError(error || "Erreur lors de l'upload");
            }
          }
        );

        setLocalPreview(imageUrl);
        onImageUploaded(imageUrl);
      } catch (uploadErr: any) {
        const errorMsg =
          uploadErr.message || "Erreur lors de l'upload de l'image";
        setUploadError(errorMsg);
        errorToast(errorMsg);
      } finally {
        setIsUploading(false);
      }
    },
    [artistName, artistSurname, artworkName, onImageUploaded, errorToast]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    maxFiles: 1,
    multiple: false,
    disabled: disabled || isUploading,
  });

  const handleRemove = () => {
    setLocalPreview(null);
    setUploadError(null);
    onImageUploaded("");
  };

  const displayPreview = localPreview || previewUrl;

  return (
    <div className="flex flex-col gap-2">
      {displayPreview ? (
        <div className="relative w-full">
          <div className="relative w-full h-64 rounded-lg border overflow-hidden bg-gray-100 dark:bg-gray-800">
            <Image
              src={displayPreview}
              alt="Aperçu de l'image principale"
              fill
              className="object-contain"
            />
          </div>
          {!disabled && !isUploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-primary bg-primary/5"
              : disabled || isUploading
              ? "border-gray-300 bg-gray-100 cursor-not-allowed dark:border-gray-600 dark:bg-gray-800"
              : "border-gray-300 bg-gray-50 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800/50"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-2">
            {isUploading ? (
              <>
                <Loader2 size={32} className="text-primary animate-spin" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Upload en cours...
                </p>
              </>
            ) : (
              <>
                <Camera
                  size={32}
                  className="text-gray-500 dark:text-gray-400"
                />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {isDragActive
                    ? "Déposez l'image ici..."
                    : "Cliquez ou glissez-déposez une image"}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  JPEG, PNG, GIF, WebP (max 10MB)
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  L'image sera automatiquement convertie en WebP et uploadée
                  vers Firebase
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {(error || uploadError) && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {uploadError || error}
        </p>
      )}
    </div>
  );
}
