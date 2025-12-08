"use client";

import { X, AlertCircle } from "lucide-react";
import { FieldErrors } from "react-hook-form";
import { useEffect } from "react";
import { createPortal } from "react-dom";
import { PhysicalArtworkFormData } from "../../../createPhysicalArtwork/schema";

interface ValidationErrorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  errors: FieldErrors<PhysicalArtworkFormData>;
  onNavigateToTab?: (tabId: string) => void;
}

// Mapping des champs vers leurs onglets et noms d'affichage
const fieldMapping: Record<
  string,
  { tab: string; label: string; fieldId?: string }
> = {
  physicalCollectionId: {
    tab: "collection",
    label: "Collection",
    fieldId: "physicalCollectionId",
  },
  name: {
    tab: "characteristics",
    label: "Nom",
    fieldId: "name",
  },
  description: {
    tab: "characteristics",
    label: "Description",
    fieldId: "description",
  },
  metaTitle: {
    tab: "characteristics",
    label: "Titre SEO",
    fieldId: "metaTitle",
  },
  metaDescription: {
    tab: "characteristics",
    label: "Description SEO",
    fieldId: "metaDescription",
  },
  pricePhysicalBeforeTax: {
    tab: "characteristics",
    label: "Prix de l'œuvre physique (HT)",
    fieldId: "pricePhysicalBeforeTax",
  },
  initialQty: {
    tab: "characteristics",
    label: "Quantité disponible",
    fieldId: "initialQty",
  },
  width: {
    tab: "characteristics",
    label: "Largeur (cm)",
    fieldId: "width",
  },
  height: {
    tab: "characteristics",
    label: "Hauteur (cm)",
    fieldId: "height",
  },
  weight: {
    tab: "characteristics",
    label: "Poids (kg)",
    fieldId: "weight",
  },
  mediumId: {
    tab: "characteristics",
    label: "Support/Medium",
    fieldId: "mediumId",
  },
  styleIds: {
    tab: "characteristics",
    label: "Styles",
    fieldId: "styleIds",
  },
  techniqueIds: {
    tab: "characteristics",
    label: "Techniques",
    fieldId: "techniqueIds",
  },
  themeIds: {
    tab: "characteristics",
    label: "Thèmes",
    fieldId: "themeIds",
  },
  supportId: {
    tab: "characteristics",
    label: "Support",
    fieldId: "supportId",
  },
  shippingAddressId: {
    tab: "characteristics",
    label: "Adresse d'expédition",
    fieldId: "shippingAddressId",
  },
  mainImageUrl: {
    tab: "visual",
    label: "Image principale",
    fieldId: "mainImageUrl",
  },
  images: {
    tab: "visual",
    label: "Image principale",
    fieldId: "images",
  },
};

const tabLabels: Record<string, string> = {
  collection: "Collection",
  characteristics: "Caractéristiques de l'oeuvre",
  visual: "Visuel de l'oeuvre",
};

export default function ValidationErrorsModal({
  isOpen,
  onClose,
  errors,
  onNavigateToTab,
}: ValidationErrorsModalProps) {
  // Empêcher le scroll du body quand la modale est ouverte
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Organiser les erreurs par onglet
  const errorsByTab: Record<string, Array<{ field: string; label: string; message: string; fieldId?: string }>> = {};

  Object.keys(errors).forEach((field) => {
    const error = errors[field as keyof PhysicalArtworkFormData];
    if (error) {
      const mapping = fieldMapping[field];
      if (mapping) {
        const tab = mapping.tab;
        if (!errorsByTab[tab]) {
          errorsByTab[tab] = [];
        }
        errorsByTab[tab].push({
          field,
          label: mapping.label,
          message:
            typeof error.message === "string"
              ? error.message
              : "Ce champ est requis",
          fieldId: mapping.fieldId,
        });
      }
    }
  });

  const totalErrors = Object.values(errorsByTab).reduce(
    (sum, tabErrors) => sum + tabErrors.length,
    0
  );

  // Ne pas afficher la modale s'il n'y a pas d'erreurs
  if (totalErrors === 0) {
    return null;
  }

  const modalContent = (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      onClick={onClose}
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0, 
        bottom: 0,
        zIndex: 999999,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        backdropFilter: 'blur(4px)'
      }}
    >
      <div
        className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border-2 border-red-200 dark:border-red-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-fadeIn"
        onClick={(e) => e.stopPropagation()}
        style={{ 
          position: 'relative', 
          zIndex: 1000000,
          backgroundColor: 'rgb(254 242 242)'
        }}
      >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-red-200 dark:border-red-800 bg-red-100/50 dark:bg-red-900/30">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-6 h-6 text-red-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 m-0">
                Erreurs de validation
              </h2>
            </div>
            <button
              className="bg-transparent border-0 text-2xl leading-none cursor-pointer text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors p-1 w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={onClose}
              aria-label="Fermer"
            >
              <X size={20} />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto flex-1 min-h-0 bg-white dark:bg-gray-800">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 leading-relaxed">
              {totalErrors} champ{totalErrors > 1 ? "s" : ""} obligatoire
              {totalErrors > 1 ? "s" : ""} manquant{totalErrors > 1 ? "s" : ""}.
              Veuillez corriger les erreurs ci-dessous :
            </p>

            <div className="space-y-6">
              {Object.entries(errorsByTab).map(([tab, tabErrors]) => (
                <div key={tab} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 pb-6 last:pb-0">
                  <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {tabLabels[tab] || tab}
                    </h3>
                    {onNavigateToTab && (
                      <button
                        type="button"
                        onClick={() => {
                          onNavigateToTab(tab);
                          onClose();
                        }}
                        className="text-sm text-primary hover:text-primary-dark underline whitespace-nowrap"
                      >
                        Aller à cet onglet
                      </button>
                    )}
                  </div>
                  <ul className="space-y-2">
                    {tabErrors.map((error, index) => (
                      <li
                        key={`${error.field}-${index}`}
                        className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400 leading-relaxed"
                      >
                        <span className="text-red-500 mt-0.5 flex-shrink-0">•</span>
                        <span className="break-words">
                          <strong className="font-semibold">{error.label}</strong>: {error.message}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-red-200 dark:border-red-800 bg-red-100/50 dark:bg-red-900/30 flex justify-end flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
  );

  // Utiliser createPortal pour rendre la modale directement dans le body
  if (typeof window !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  
  return null;
}

