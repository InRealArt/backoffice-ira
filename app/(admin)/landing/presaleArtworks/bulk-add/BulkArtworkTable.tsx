"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { AlertCircle, CheckCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ArtworkData } from "./BulkAddForm";
import ImageUploadInput from "./ImageUploadInput";

interface BulkArtworkTableProps {
  artworksData: ArtworkData[];
  onDataChange: (data: ArtworkData[]) => void;
  isSubmitting: boolean;
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
          className="object-cover rounded"
          onError={(e) => {
            e.currentTarget.style.display = "none";
          }}
        />
      </div>
      <span className="text-xs text-green-600 dark:text-green-400">✓</span>
    </div>
  );
}

export default function BulkArtworkTable({
  artworksData,
  onDataChange,
  isSubmitting,
}: BulkArtworkTableProps) {
  const t = useTranslations("art.bulkAddPage.form");
  const tTable = useTranslations("art.bulkAddPage.table");
  const [validationErrors, setValidationErrors] = useState<
    Record<number, string[]>
  >({});

  const updateArtwork = (
    index: number,
    field: keyof ArtworkData,
    value: string
  ) => {
    const newData = [...artworksData];
    newData[index] = {
      ...newData[index],
      [field]: value,
    };
    onDataChange(newData);

    // Valider l'œuvre mise à jour
    validateArtwork(index, newData[index]);
  };

  const validateArtwork = (index: number, artwork: ArtworkData) => {
    const errors: string[] = [];

    if (!artwork.name.trim()) {
      errors.push(t("validation.nameRequired"));
    }

    if (!artwork.imageFile && !artwork.imageUrl) {
      errors.push(t("validation.imageRequired"));
    } else if (artwork.imageUrl && artwork.imageUrl.trim()) {
      try {
        new URL(artwork.imageUrl);
      } catch {
        errors.push(t("validation.imageUrlInvalid"));
      }
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

    setValidationErrors((prev) => ({
      ...prev,
      [index]: errors,
    }));
  };

  // Valider toutes les œuvres au montage
  useEffect(() => {
    artworksData.forEach((artwork, index) => {
      validateArtwork(index, artwork);
    });
  }, []);

  const getRowStatus = (index: number) => {
    const errors = validationErrors[index] || [];
    if (errors.length === 0) {
      return "valid";
    }
    return "error";
  };

  const getTotalErrors = () => {
    return Object.values(validationErrors).reduce(
      (total, errors) => total + errors.length,
      0
    );
  };

  return (
    <div className="form-card">
      <div className="card-content">
        <div className="form-group">
          <h3 className="form-title">{tTable("title")}</h3>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <span className="text-sm text-text-secondary">
              {artworksData.length > 1
                ? tTable("artworksCountPlural", { count: artworksData.length })
                : tTable("artworksCount", { count: artworksData.length })}{" "}
              •
              {getTotalErrors() === 0 ? (
                <span className="text-green-600 dark:text-green-400 ml-1">
                  <CheckCircle size={16} className="inline mr-1" />
                  {tTable("allValid")}
                </span>
              ) : (
                <span className="text-red-600 dark:text-red-400 ml-1">
                  <AlertCircle size={16} className="inline mr-1" />
                  {getTotalErrors() > 1
                    ? tTable("errorsToFixPlural", { count: getTotalErrors() })
                    : tTable("errorsToFix", { count: getTotalErrors() })}
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-[50px]">{tTable("columns.number")}</th>
                <th>{tTable("columns.name")}</th>
                <th>{tTable("columns.description")}</th>
                <th className="w-[100px]">{tTable("columns.height")}</th>
                <th className="w-[100px]">{tTable("columns.width")}</th>
                <th className="w-[100px]">{tTable("columns.price")}</th>
                <th>{tTable("columns.image")}</th>
              </tr>
            </thead>
            <tbody>
              {artworksData.map((artwork, index) => {
                const status = getRowStatus(index);
                const errors = validationErrors[index] || [];

                return (
                  <tr
                    key={index}
                    className={status === "error" ? "error-row" : ""}
                  >
                    <td className="text-center font-bold">{index + 1}</td>

                    <td>
                      <input
                        type="text"
                        value={artwork.name}
                        onChange={(e) =>
                          updateArtwork(index, "name", e.target.value)
                        }
                        className={`form-input ${
                          errors.some(
                            (e) => e.includes("nom") || e.includes("name")
                          )
                            ? "input-error"
                            : ""
                        }`}
                        placeholder={tTable("placeholders.name")}
                        disabled={isSubmitting}
                      />
                    </td>

                    <td>
                      <textarea
                        value={artwork.description}
                        onChange={(e) =>
                          updateArtwork(index, "description", e.target.value)
                        }
                        className="form-textarea"
                        placeholder={tTable("placeholders.description")}
                        rows={2}
                        disabled={isSubmitting}
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={artwork.height}
                        onChange={(e) =>
                          updateArtwork(index, "height", e.target.value)
                        }
                        className={`form-input ${
                          errors.some(
                            (e) => e.includes("hauteur") || e.includes("height")
                          )
                            ? "input-error"
                            : ""
                        }`}
                        placeholder={tTable("placeholders.height")}
                        disabled={isSubmitting}
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={artwork.width}
                        onChange={(e) =>
                          updateArtwork(index, "width", e.target.value)
                        }
                        className={`form-input ${
                          errors.some(
                            (e) => e.includes("largeur") || e.includes("width")
                          )
                            ? "input-error"
                            : ""
                        }`}
                        placeholder={tTable("placeholders.width")}
                        disabled={isSubmitting}
                      />
                    </td>

                    <td>
                      <input
                        type="text"
                        value={artwork.price}
                        onChange={(e) =>
                          updateArtwork(index, "price", e.target.value)
                        }
                        className={`form-input ${
                          errors.some(
                            (e) => e.includes("prix") || e.includes("price")
                          )
                            ? "input-error"
                            : ""
                        }`}
                        placeholder={tTable("placeholders.price")}
                        disabled={isSubmitting}
                      />
                    </td>

                    <td>
                      <ImageUploadInput
                        onFileSelect={(file) => {
                          const newData = [...artworksData];
                          newData[index] = {
                            ...newData[index],
                            imageFile: file,
                            imageUrl: file ? "" : newData[index].imageUrl,
                          };
                          onDataChange(newData);
                          validateArtwork(index, newData[index]);
                        }}
                        previewUrl={
                          artwork.imageFile
                            ? URL.createObjectURL(artwork.imageFile)
                            : artwork.imageUrl || null
                        }
                        error={errors.find((e) => e.includes("image"))}
                        disabled={isSubmitting}
                        artworkIndex={index}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {getTotalErrors() > 0 && (
          <div className="form-group">
            <div className="p-4 bg-background-light dark:bg-background-light border border-red-300 dark:border-red-700 rounded-md mt-4">
              <h5 className="text-red-600 dark:text-red-400 mb-3 text-base font-semibold m-0">
                {tTable("errorsTitle")}
              </h5>
              <div>
                {Object.entries(validationErrors).map(
                  ([index, errors]) =>
                    errors.length > 0 && (
                      <div key={index} className="mb-2">
                        <strong className="text-red-600 dark:text-red-400">
                          {tTable("artworkNumber", {
                            number: parseInt(index) + 1,
                          })}
                        </strong>
                        <ul className="mt-1 ml-4 list-disc text-red-700 dark:text-red-300">
                          {errors.map((error, errorIndex) => (
                            <li key={errorIndex} className="form-error">
                              {error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
