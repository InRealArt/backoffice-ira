"use client";

import { useState } from "react";
import styles from "./DynamicFormList.module.scss";
import { useTranslations } from "next-intl";
import {
  UseFormRegister,
  FieldErrors,
  UseFormSetValue,
  UseFormGetValues,
} from "react-hook-form";
import Button from "@/app/components/Button/Button";
import { Trash2, Plus } from "lucide-react";

export interface DynamicFormListField {
  name: string;
  label: string;
  type?: "text" | "number" | "textarea";
  placeholder?: string;
  required?: boolean;
  validation?: (value: any) => string | true;
  className?: string;
  colSpan?: number; // Nombre de colonnes à occuper dans la grille (1-3)
  groupWith?: string; // Nom du champ avec lequel grouper sur la même ligne
}

export interface DynamicFormListProps<T extends Record<string, any>> {
  title: string;
  description?: string;
  fields: DynamicFormListField[];
  items: T[];
  onItemsChange: (items: T[]) => void;
  register: UseFormRegister<any>;
  errors: FieldErrors<any>;
  setValue: UseFormSetValue<any>;
  getValues: UseFormGetValues<any>;
  maxItems?: number;
  minItems?: number;
  itemLabel?: (item: T, index: number) => string;
  className?: string;
}

export default function DynamicFormList<T extends Record<string, any>>({
  title,
  description,
  fields,
  items,
  onItemsChange,
  register,
  errors,
  setValue,
  getValues,
  maxItems = 10,
  minItems = 0,
  itemLabel,
  className = "",
}: DynamicFormListProps<T>) {
  const t = useTranslations("common");
  const [itemErrors, setItemErrors] = useState<
    Record<number, Record<string, string>>
  >({});

  const addItem = () => {
    if (items.length >= maxItems) {
      return;
    }
    const newItem = {} as T;
    fields.forEach((field) => {
      (newItem as any)[field.name] = field.type === "number" ? null : "";
    });
    onItemsChange([...items, newItem]);
  };

  const removeItem = (index: number) => {
    if (items.length <= minItems) {
      return;
    }
    const newItems = items.filter((_, i) => i !== index);
    onItemsChange(newItems);

    // Nettoyer les erreurs de l'élément supprimé
    const newErrors = { ...itemErrors };
    delete newErrors[index];
    // Réindexer les erreurs
    const reindexedErrors: Record<number, Record<string, string>> = {};
    Object.keys(newErrors).forEach((key) => {
      const oldIndex = parseInt(key);
      if (oldIndex > index) {
        reindexedErrors[oldIndex - 1] = newErrors[oldIndex];
      } else if (oldIndex < index) {
        reindexedErrors[oldIndex] = newErrors[oldIndex];
      }
    });
    setItemErrors(reindexedErrors);

    // Nettoyer les valeurs du formulaire
    fields.forEach((field) => {
      setValue(`${field.name}_${index}`, undefined, { shouldValidate: false });
    });
  };

  const updateItem = (index: number, fieldName: string, value: any) => {
    const newItems = [...items];
    (newItems[index] as any)[fieldName] = value;
    onItemsChange(newItems);

    // Validation
    const field = fields.find((f) => f.name === fieldName);
    if (field?.validation) {
      const error = field.validation(value);
      if (error !== true) {
        setItemErrors((prev) => ({
          ...prev,
          [index]: { ...prev[index], [fieldName]: error },
        }));
      } else {
        setItemErrors((prev) => {
          const newErrors = { ...prev };
          if (newErrors[index]) {
            delete newErrors[index][fieldName];
            if (Object.keys(newErrors[index]).length === 0) {
              delete newErrors[index];
            }
          }
          return newErrors;
        });
      }
    }
  };

  const getFieldError = (
    index: number,
    fieldName: string
  ): string | undefined => {
    const formError = errors[`${fieldName}_${index}`];
    if (formError) {
      return (formError as any)?.message;
    }
    return itemErrors[index]?.[fieldName];
  };

  return (
    <div className={`${styles.list} ${className}`}>
      <div className={styles.head}>
        <h3 className={styles.title}>
          {title}
        </h3>
        {description && (
          <p className={styles.description}>
            {description}
          </p>
        )}
        {maxItems && (
          <p className={styles.limit}>
            Maximum {maxItems} élément{maxItems > 1 ? "s" : ""}
          </p>
        )}
      </div>

      <div className={styles.items}>
        {items.map((item, index) => (
          <div
            key={index}
            className={styles.item}
          >
            <div className={styles.itemHead}>
              <h4 className={styles.itemTitle}>
                {itemLabel ? itemLabel(item, index) : `${title} ${index + 1}`}
              </h4>
              {items.length > minItems && (
                <button
                  type="button"
                  onClick={() => removeItem(index)}
                  className={styles.remove}
                  aria-label={`Supprimer ${title} ${index + 1}`}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Grouper les champs name et year sur la même ligne */}
            {(() => {
              const nameField = fields.find((f) => f.name === "name");
              const yearField = fields.find((f) => f.name === "year");
              const otherFields = fields.filter(
                (f) => f.name !== "name" && f.name !== "year"
              );
              const hasNameAndYear = nameField && yearField;

              return (
                <>
                  {hasNameAndYear && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      {/* Champ name */}
                      {(() => {
                        const field = nameField!;
                        const fieldName = `${field.name}_${index}`;
                        const fieldValue = (items[index] as any)[field.name];
                        const error = getFieldError(index, field.name);

                        return (
                          <div key={field.name} className="md:col-span-2">
                            <label
                              htmlFor={fieldName}
                              className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                              {field.label}
                              {field.required && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </label>
                            <input
                              id={fieldName}
                              type="text"
                              {...register(fieldName, {
                                required: field.required
                                  ? `${field.label} est requis`
                                  : false,
                                validate: field.validation,
                              })}
                              value={fieldValue || ""}
                              onChange={(e) => {
                                updateItem(index, field.name, e.target.value);
                                setValue(fieldName, e.target.value);
                              }}
                              className={`form-input w-full ${
                                error ? "input-error" : ""
                              }`}
                              placeholder={field.placeholder}
                            />
                            {error && (
                              <p className="form-error text-xs mt-1">{error}</p>
                            )}
                          </div>
                        );
                      })()}

                      {/* Champ year */}
                      {(() => {
                        const field = yearField!;
                        const fieldName = `${field.name}_${index}`;
                        const fieldValue = (items[index] as any)[field.name];
                        const error = getFieldError(index, field.name);

                        return (
                          <div key={field.name} className="md:col-span-1">
                            <label
                              htmlFor={fieldName}
                              className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                              {field.label}
                              {field.required && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </label>
                            <input
                              id={fieldName}
                              type="number"
                              {...register(fieldName, {
                                required: field.required
                                  ? `${field.label} est requis`
                                  : false,
                                valueAsNumber: true,
                                validate: field.validation,
                              })}
                              value={fieldValue ?? ""}
                              onChange={(e) => {
                                const value =
                                  e.target.value === ""
                                    ? null
                                    : parseInt(e.target.value, 10);
                                updateItem(index, field.name, value);
                                setValue(fieldName, value);
                              }}
                              className={`form-input w-full ${
                                error ? "input-error" : ""
                              }`}
                              placeholder={field.placeholder}
                            />
                            {error && (
                              <p className="form-error text-xs mt-1">{error}</p>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                  )}

                  {/* Autres champs */}
                  {(hasNameAndYear ? otherFields : fields).length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {(hasNameAndYear ? otherFields : fields).map((field) => {
                        const fieldName = `${field.name}_${index}`;
                        const fieldValue = (items[index] as any)[field.name];
                        const error = getFieldError(index, field.name);

                        // Déterminer le colSpan : par défaut, textarea = 3, sinon utiliser colSpan ou 1
                        const colSpan =
                          field.colSpan !== undefined
                            ? field.colSpan
                            : field.type === "textarea"
                            ? 3
                            : 1;

                        // Construire les classes CSS pour le colSpan
                        let colSpanClass = "";
                        if (colSpan === 3) {
                          colSpanClass = "md:col-span-3";
                        } else if (colSpan === 2) {
                          colSpanClass = "md:col-span-2";
                        } else if (colSpan === 1) {
                          colSpanClass = "md:col-span-1";
                        }

                        // Combiner les classes : className personnalisé + colSpan
                        const finalClassName = [field.className, colSpanClass]
                          .filter(Boolean)
                          .join(" ");

                        return (
                          <div key={field.name} className={finalClassName}>
                            <label
                              htmlFor={fieldName}
                              className="block mb-1 text-sm font-medium text-gray-700 dark:text-gray-300"
                            >
                              {field.label}
                              {field.required && (
                                <span className="text-red-500 ml-1">*</span>
                              )}
                            </label>
                            {field.type === "textarea" ? (
                              <textarea
                                id={fieldName}
                                {...register(fieldName, {
                                  required: field.required
                                    ? `${field.label} est requis`
                                    : false,
                                  validate: field.validation,
                                })}
                                value={fieldValue || ""}
                                onChange={(e) => {
                                  updateItem(index, field.name, e.target.value);
                                  setValue(fieldName, e.target.value);
                                }}
                                className={`form-textarea w-full ${
                                  error ? "input-error" : ""
                                }`}
                                placeholder={field.placeholder}
                                rows={3}
                              />
                            ) : field.type === "number" ? (
                              <input
                                id={fieldName}
                                type="number"
                                {...register(fieldName, {
                                  required: field.required
                                    ? `${field.label} est requis`
                                    : false,
                                  valueAsNumber: true,
                                  validate: field.validation,
                                })}
                                value={fieldValue ?? ""}
                                onChange={(e) => {
                                  const value =
                                    e.target.value === ""
                                      ? null
                                      : parseInt(e.target.value, 10);
                                  updateItem(index, field.name, value);
                                  setValue(fieldName, value);
                                }}
                                className={`form-input w-full ${
                                  error ? "input-error" : ""
                                }`}
                                placeholder={field.placeholder}
                              />
                            ) : (
                              <input
                                id={fieldName}
                                type="text"
                                {...register(fieldName, {
                                  required: field.required
                                    ? `${field.label} est requis`
                                    : false,
                                  validate: field.validation,
                                })}
                                value={fieldValue || ""}
                                onChange={(e) => {
                                  updateItem(index, field.name, e.target.value);
                                  setValue(fieldName, e.target.value);
                                }}
                                className={`form-input w-full ${
                                  error ? "input-error" : ""
                                }`}
                                placeholder={field.placeholder}
                              />
                            )}
                            {error && (
                              <p className="form-error text-xs mt-1">{error}</p>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        ))}

        {items.length === 0 && (
          <div className={styles.empty}>
            <p>{t("noItemsAdded")}</p>
          </div>
        )}
      </div>

      {items.length < maxItems && (
        <Button
          type="button"
          variant="secondary"
          onClick={addItem}
          className={styles.add}
        >
          <Plus className="w-4 h-4 mr-2" />
          {t("add")} {title}
        </Button>
      )}
    </div>
  );
}
