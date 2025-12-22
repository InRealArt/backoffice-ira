"use client";

import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import Image from "next/image";
import { Camera, X } from "lucide-react";
import { useTranslations } from "next-intl";

interface ImageUploadInputProps {
  onFileSelect: (file: File | null) => void;
  previewUrl?: string | null;
  error?: string;
  disabled?: boolean;
  artworkIndex: number;
}

export default function ImageUploadInput({
  onFileSelect,
  previewUrl,
  error,
  disabled = false,
  artworkIndex,
}: ImageUploadInputProps) {
  const t = useTranslations("art.bulkAddPage.imageUpload");
  const [localPreview, setLocalPreview] = useState<string | null>(
    previewUrl || null
  );
  const [localError, setLocalError] = useState<string | null>(null);
  const [hasLocalFile, setHasLocalFile] = useState(false);

  useEffect(() => {
    if (!hasLocalFile) {
      setLocalPreview(previewUrl || null);
    }
  }, [previewUrl, hasLocalFile]);

  const onDrop = useCallback(
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
          setLocalError(t("errors.unsupportedFormat"));
          onFileSelect(null);
          return;
        }

        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          setLocalError(t("errors.imageTooLarge"));
          onFileSelect(null);
          return;
        }

        setLocalError(null);
        setHasLocalFile(true);

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
    disabled,
  });

  const handleRemove = () => {
    setLocalPreview(null);
    setHasLocalFile(false);
    onFileSelect(null);
  };

  const displayPreview = localPreview || previewUrl;

  return (
    <div className="flex flex-col gap-2">
      {displayPreview ? (
        <div className="relative w-full">
          <div className="relative w-24 h-24 rounded border overflow-hidden">
            <Image
              src={displayPreview}
              alt={t("preview", { index: artworkIndex + 1 })}
              fill
              className="object-cover"
            />
          </div>
          {!disabled && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
              style={{ transform: "translate(50%, -50%)" }}
            >
              <X size={12} />
            </button>
          )}
        </div>
      ) : (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded p-2 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-blue-500 bg-blue-50"
              : disabled
              ? "border-gray-300 bg-gray-100 cursor-not-allowed"
              : "border-gray-300 bg-gray-50 hover:border-gray-400"
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center gap-1">
            <Camera size={20} className="text-gray-500" />
            <p className="text-xs text-gray-600">
              {isDragActive
                ? t("dropImage")
                : t("clickOrDrag")}
            </p>
            <p className="text-xs text-gray-400">
              {t("formats")}
            </p>
          </div>
        </div>
      )}

      {(error || localError) && (
        <p className="text-xs text-red-600">{localError || error}</p>
      )}
    </div>
  );
}
