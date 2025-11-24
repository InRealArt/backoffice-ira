"use client";

import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { Camera, X } from "lucide-react";

interface OptionalImageUploadProps {
  onFileSelect: (file: File | null) => void;
  onDelete?: () => void;
  label: string;
  description?: string;
  previewUrl?: string | null;
  error?: string;
  allowDelete?: boolean;
}

export default function OptionalImageUpload({
  onFileSelect,
  onDelete,
  label,
  description,
  previewUrl,
  error,
  allowDelete = false,
}: OptionalImageUploadProps) {
  const [localPreview, setLocalPreview] = useState<string | null>(
    previewUrl || null
  );
  const [localError, setLocalError] = useState<string | null>(null);
  const [hasLocalFile, setHasLocalFile] = useState(false);

  // Mettre à jour localPreview quand previewUrl change (seulement si aucun fichier local n'est sélectionné)
  useEffect(() => {
    if (!hasLocalFile) {
      setLocalPreview(previewUrl || null);
    }
  }, [previewUrl, hasLocalFile]);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) {
        // Vérifier le type de fichier
        const validTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
          "image/webp",
        ];
        if (!validTypes.includes(file.type)) {
          setLocalError("Format d'image non supporté");
          onFileSelect(null);
          return;
        }

        // Vérifier la taille (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
          setLocalError("L'image est trop volumineuse (max 10MB)");
          onFileSelect(null);
          return;
        }

        setLocalError(null);
        setHasLocalFile(true);

        // Créer une preview locale
        const reader = new FileReader();
        reader.onloadend = () => {
          setLocalPreview(reader.result as string);
        };
        reader.readAsDataURL(file);

        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".jpeg", ".jpg", ".png", ".gif", ".webp"],
    },
    maxFiles: 1,
    multiple: false,
  });

  const handleRemove = () => {
    setLocalPreview(null);
    setLocalError(null);
    setHasLocalFile(false);
    onFileSelect(null);
    if (onDelete && allowDelete) {
      onDelete();
    }
  };

  const displayPreview = localPreview || previewUrl;

  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      {description && (
        <p
          className="form-help text-muted mb-2"
          style={{ fontSize: "0.875rem" }}
        >
          {description}
        </p>
      )}

      {displayPreview ? (
        <div
          style={{
            position: "relative",
            width: "100%",
            maxWidth: "300px",
            aspectRatio: "1",
            borderRadius: "8px",
            overflow: "hidden",
            marginBottom: "0.5rem",
            border: "1px solid #e0e0e0",
          }}
        >
          <Image
            src={displayPreview}
            alt="Aperçu de l'image"
            fill
            style={{ objectFit: "cover" }}
          />
          <button
            type="button"
            onClick={handleRemove}
            style={{
              position: "absolute",
              top: "8px",
              right: "8px",
              background: "rgba(0, 0, 0, 0.7)",
              color: "white",
              border: "none",
              borderRadius: "4px",
              padding: "6px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(0, 0, 0, 0.9)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "rgba(0, 0, 0, 0.7)")
            }
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <div
          {...getRootProps()}
          style={{
            border: `2px dashed ${isDragActive ? "#4dabf7" : "#ccc"}`,
            borderRadius: "8px",
            padding: "1.5rem",
            textAlign: "center",
            cursor: "pointer",
            backgroundColor: isDragActive ? "#f0f8ff" : "#fafafa",
            transition: "all 0.2s ease",
          }}
        >
          <input {...getInputProps()} />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <Camera size={24} color="#666" />
            <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 500 }}>
              {isDragActive
                ? "Déposez votre image ici..."
                : "Cliquez ou glissez-déposez une image"}
            </p>
            <p style={{ margin: 0, fontSize: "0.75rem", color: "#666" }}>
              Formats: JPEG, PNG, GIF, WebP (max 10MB)
            </p>
          </div>
        </div>
      )}

      {(error || localError) && (
        <p
          className="form-error"
          style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}
        >
          {localError || error}
        </p>
      )}
    </div>
  );
}
