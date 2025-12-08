"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useArtworkForm } from "./useArtworkForm";
import { ArtworkFormProps } from "./types";
import ImagePreview from "./ImagePreview";
import PdfPreview from "./PdfPreview";
// styles replaced by Tailwind utilities
import { normalizeString } from "@/lib/utils";
import {
  MainInfoSection,
  SeoSection,
  PricingSection,
  PhysicalPropertiesSection,
  NftPropertiesSection,
  ArtworkCharacteristicsSection,
  MediaFilesSection,
  TagsSection,
  ShippingAddressSection,
  FormActions,
  PhysicalCertificateSection,
  NftCertificateSection,
  CollectionSection,
} from "./sections";
import { useRouter } from "next/navigation";
import { deletePhysicalItem } from "@/lib/actions/prisma-actions";
import { useToast } from "@/app/components/Toast/ToastContext";
import Button from "@/app/components/Button/Button";
import ArtworkTabs from "./ArtworkTabs";
import ValidationErrorsModal from "./components/ValidationErrorsModal";
import ProgressModal from "@/app/(protected)/art/create-artist-profile/ProgressModal";

export default function ArtworkForm({
  mode = "create",
  addresses = [],
  mediums = [],
  styles: artStyles = [],
  techniques = [],
  themes = [],
  supports = [],
  collections = [],
  artistName = "",
  artistSurname = "",
  initialData = {},
  onSuccess,
  isPhysicalOnly = false,
  readOnlyCollectionId,
}: ArtworkFormProps) {
  // État local pour le slug et le titre/nom
  const [localTitle, setLocalTitle] = useState(initialData?.title || "");
  const [localSlug, setLocalSlug] = useState(initialData?.slug || "");

  // État local pour les options de tarification
  // Si isPhysicalOnly est true, on force hasPhysicalOnly à true
  const [hasPhysicalOnly, setHasPhysicalOnly] = useState(
    isPhysicalOnly || initialData?.hasPhysicalOnly || false
  );
  const [hasNftOnly, setHasNftOnly] = useState(
    isPhysicalOnly ? false : initialData?.hasNftOnly || false
  );
  const [hasNftPlusPhysical, setHasNftPlusPhysical] = useState(
    initialData?.hasNftPlusPhysical || false
  );

  // États pour la détection des entités liées à l'Item
  const [hasPhysicalItem, setHasPhysicalItem] = useState<boolean>(
    !!initialData?.physicalItem
  );
  const [hasNftItem, setHasNftItem] = useState<boolean>(!!initialData?.nftItem);
  const [hasCertificate, setHasCertificate] = useState<boolean>(
    !!initialData?.certificateUrl
  );

  // États pour suivre les changements des options de tarification
  const [initialPhysicalOnly, setInitialPhysicalOnly] = useState<boolean>(
    !!initialData?.physicalItem
  );
  const [initialNftOnly, setInitialNftOnly] = useState<boolean>(
    !!initialData?.nftItem
  );

  // État pour le mode lecture seule
  const [isFormReadOnly, setIsFormReadOnly] = useState<boolean>(false);

  // État pour le modal d'erreurs de validation
  const [showValidationModal, setShowValidationModal] =
    useState<boolean>(false);

  // État pour la modale de progression
  const [showProgressModal, setShowProgressModal] = useState<boolean>(false);
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

  // État pour l'onglet actif (pour la navigation depuis le modal)
  const [activeTabId, setActiveTabId] = useState<string>("collection");

  // Récupérer les statuts des items
  const physicalItemStatus = initialData?.physicalItem?.status;
  const nftItemStatus = initialData?.nftItem?.status;

  // Vérifier si un des items est au statut "listed"
  useEffect(() => {
    if (mode === "edit") {
      const isPhysicalListed = physicalItemStatus === "listed";
      const isNftListed = nftItemStatus === "listed";

      setIsFormReadOnly(isPhysicalListed || isNftListed);
    } else {
      // En mode création, le formulaire n'est jamais en lecture seule
      setIsFormReadOnly(false);
    }
  }, [mode, physicalItemStatus, nftItemStatus]);

  // Callbacks pour la progression
  const progressCallbacks = {
    onProgressUpdate: (
      stepId: string,
      status: "pending" | "in-progress" | "completed" | "error",
      error?: string
    ) => {
      setProgressSteps((prev) =>
        prev.map((step) =>
          step.id === stepId
            ? { ...step, status, ...(error && { error }) }
            : step
        )
      );
      if (status === "error" && error) {
        setProgressError(error);
      }
    },
  };

  const {
    isSubmitting,
    previewImages,
    previewCertificate,
    previewPhysicalCertificate,
    previewNftCertificate,
    tags,
    setTags,
    secondaryImages,
    isEditMode,
    fileInputRef,
    certificateInputRef,
    physicalCertificateInputRef,
    nftCertificateInputRef,
    secondaryImagesInputRef,
    pendingImagesByTypeRef,
    removedImagesByTypeRef,
    handleImageChange,
    handleSecondaryImagesChange,
    removeSecondaryImage,
    handleCertificateChange,
    handlePhysicalCertificateChange,
    handleNftCertificateChange,
    onSubmit: originalOnSubmit,
    isExistingImage,
    handleSubmit,
    formState: { errors },
    register,
    setValue,
    control,
    getValues,
  } = useArtworkForm({
    mode,
    initialData,
    onSuccess,
    isPhysicalOnly,
    progressCallbacks,
    onTitleChange: (name) => {
      setLocalTitle(name);
      setLocalSlug(normalizeString(name));
    },
    onPricingOptionsChange: {
      setHasPhysicalOnly,
      setHasNftOnly,
      setHasNftPlusPhysical,
    },
  });

  const certificateFile = certificateInputRef.current?.files?.[0] || null;

  const router = useRouter();
  const { error: errorToast } = useToast();
  // Surveiller les changements de titre depuis le formulaire
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isFormReadOnly) {
      const newName = e.target.value;
      setLocalTitle(newName);
      setLocalSlug(normalizeString(newName));
    }
  };

  // Forcer hasPhysicalOnly à true si isPhysicalOnly est true
  useEffect(() => {
    if (isPhysicalOnly) {
      setHasPhysicalOnly(true);
      setHasNftOnly(false);
      setValue("hasPhysicalOnly", true);
      setValue("hasNftOnly", false);
    }
  }, [isPhysicalOnly, setValue]);

  // Surveiller les changements des options de tarification
  const handlePricingOptionChange = (
    option: "hasPhysicalOnly" | "hasNftOnly" | "hasNftPlusPhysical",
    checked: boolean
  ) => {
    if (isFormReadOnly || isPhysicalOnly) return;

    switch (option) {
      case "hasPhysicalOnly":
        setHasPhysicalOnly(checked);
        break;
      case "hasNftOnly":
        setHasNftOnly(checked);
        break;
      case "hasNftPlusPhysical":
        setHasNftPlusPhysical(checked);
        // Si l'option NFT+Physique est cochée, activer automatiquement les deux autres options
        if (checked) {
          setHasPhysicalOnly(true);
          setHasNftOnly(true);
          setValue("hasPhysicalOnly", true);
          setValue("hasNftOnly", true);
        }
        break;
    }
  };

  // Effet pour déterminer quelles sections afficher en fonction des relations présentes
  useEffect(() => {
    if (mode === "edit" && initialData) {
      // Détection du PhysicalItem
      if (initialData.physicalItem) {
        // Cocher la case "Œuvre physique" et activer la section
        setHasPhysicalItem(true);
        setHasPhysicalOnly(true);
        setInitialPhysicalOnly(true);

        // Enregistrer cette option dans le formulaire
        setValue("hasPhysicalOnly", true);

        // Mettre à jour les valeurs du formulaire avec les données du PhysicalItem
        if (initialData.physicalItem.price) {
          setValue(
            "pricePhysicalBeforeTax",
            initialData.physicalItem.price.toString()
          );
        }
        if (initialData.physicalItem.initialQty) {
          // Convertir la quantité en chaîne de caractères pour éviter l'erreur "Expected string, received number"
          setValue(
            "initialQty",
            initialData.physicalItem.initialQty.toString()
          );
        }
        if (initialData.physicalItem.height) {
          setValue("height", initialData.physicalItem.height.toString());
        }
        if (initialData.physicalItem.width) {
          setValue("width", initialData.physicalItem.width.toString());
        }
        if (initialData.physicalItem.weight) {
          setValue("weight", initialData.physicalItem.weight.toString());
        }
        if (initialData.physicalItem.creationYear) {
          setValue(
            "creationYear",
            initialData.physicalItem.creationYear.toString()
          );
        }
        if (initialData.physicalItem.shippingAddressId) {
          setValue(
            "shippingAddressId",
            initialData.physicalItem.shippingAddressId.toString()
          );
        }

        // Initialiser les caractéristiques artistiques depuis PhysicalItem
        if (initialData.physicalItem.mediumId) {
          setValue("mediumId", initialData.physicalItem.mediumId.toString());
        }
        if (initialData.physicalItem.supportId) {
          setValue("supportId", initialData.physicalItem.supportId.toString());
        }
        if (
          initialData.physicalItem.itemStyles &&
          initialData.physicalItem.itemStyles.length > 0
        ) {
          const styleIds = initialData.physicalItem.itemStyles.map(
            (is) => is.styleId
          );
          setValue("styleIds", styleIds);
        }
        if (
          initialData.physicalItem.itemTechniques &&
          initialData.physicalItem.itemTechniques.length > 0
        ) {
          const techniqueIds = initialData.physicalItem.itemTechniques.map(
            (it) => it.techniqueId
          );
          setValue("techniqueIds", techniqueIds);
        }
        if (
          initialData.physicalItem.itemThemes &&
          initialData.physicalItem.itemThemes.length > 0
        ) {
          const themeIds = initialData.physicalItem.itemThemes.map(
            (ith) => ith.themeId
          );
          setValue("themeIds", themeIds);
        }
      }

      // Initialiser les caractéristiques artistiques depuis Item (pour rétrocompatibilité)
      if (initialData.mediumId && !initialData.physicalItem?.mediumId) {
        setValue("mediumId", initialData.mediumId.toString());
      }
      // Initialiser styleIds depuis initialData si pas dans physicalItem
      if (
        initialData.styleIds &&
        initialData.styleIds.length > 0 &&
        !initialData.physicalItem?.itemStyles
      ) {
        setValue("styleIds", initialData.styleIds);
      }
      // Initialiser techniqueIds depuis initialData si pas dans physicalItem
      if (
        initialData.techniqueIds &&
        initialData.techniqueIds.length > 0 &&
        !initialData.physicalItem?.itemTechniques
      ) {
        setValue("techniqueIds", initialData.techniqueIds);
      }
      // Initialiser themeIds depuis initialData si pas dans physicalItem
      if (
        initialData.themeIds &&
        initialData.themeIds.length > 0 &&
        !initialData.physicalItem?.itemThemes
      ) {
        setValue("themeIds", initialData.themeIds);
      }

      // Détection du NftItem
      if (initialData.nftItem) {
        // Cocher la case "NFT" et activer la section
        setHasNftItem(true);
        setHasNftOnly(true);
        setInitialNftOnly(true);

        // Enregistrer cette option dans le formulaire
        setValue("hasNftOnly", true);

        // Mettre à jour les valeurs du formulaire avec les données du NftItem
        if (initialData.nftItem.price) {
          setValue("priceNftBeforeTax", initialData.nftItem.price.toString());
        }

        // Vérifier si un certificat d'authenticité est associé
        if (initialData.certificateUrl) {
          setHasCertificate(true);
          setValue("certificate", initialData.certificateUrl);
        }
      }

      // Si les deux options sont présentes, activer aussi l'option combinée
      if (initialData.physicalItem && initialData.nftItem) {
        setHasNftPlusPhysical(true);
        setValue("hasNftPlusPhysical", true);
      }
    }
  }, [mode, initialData, setValue]);

  // Afficher le modal d'erreurs si des erreurs de validation sont présentes
  // Ne pas afficher si isSubmitting (pour éviter d'afficher "0 champ obligatoire")
  useEffect(() => {
    const errorCount = Object.keys(errors).length;
    console.log(
      "Debug - Nombre d'erreurs:",
      errorCount,
      "isSubmitting:",
      isSubmitting
    );
    if (errorCount > 0 && !isSubmitting) {
      setShowValidationModal(true);
    } else {
      setShowValidationModal(false);
    }
  }, [errors, isSubmitting]);

  // Gérer l'affichage de la modale de progression lors de la soumission
  useEffect(() => {
    if (isSubmitting) {
      // Vérifier qu'il n'y a pas d'erreurs avant d'afficher la modale de progression
      const errorCount = Object.keys(errors).length;
      if (errorCount === 0) {
        setShowProgressModal(true);
        setProgressSteps([
          {
            id: "validation",
            label: "Validation des données",
            status: "completed",
          },
          {
            id: "upload",
            label: "Upload des fichiers",
            status: "pending",
          },
          {
            id: "save",
            label:
              mode === "edit"
                ? "Mise à jour de l'œuvre"
                : "Création de l'œuvre",
            status: "pending",
          },
        ]);
        setProgressError(undefined);
      }
    } else {
      // Mettre à jour les étapes quand la soumission est terminée
      if (showProgressModal) {
        setProgressSteps((prev) =>
          prev.map((step) =>
            step.status === "pending" || step.status === "in-progress"
              ? { ...step, status: "completed" as const }
              : step
          )
        );
        // Fermer la modale après un court délai
        setTimeout(() => {
          setShowProgressModal(false);
          setProgressSteps([]);
        }, 1500);
      }
    }
  }, [isSubmitting, errors, mode, showProgressModal]);

  // Wrapper pour onSubmit qui vérifie les options de tarification et gère la suppression des items
  const onSubmit = async (data: any) => {
    // Vérifier qu'au moins une option de tarification est cochée
    if (!hasPhysicalOnly && !hasNftOnly) {
      errorToast("Vous devez sélectionner au moins une option de tarification");
      return;
    }

    try {
      // Si nous sommes en mode édition
      if (mode === "edit" && initialData?.id) {
        console.log("initialData.physicalItem", initialData.physicalItem);
        console.log("hasPhysicalOnly", hasPhysicalOnly);
        console.log("initialData.nftItem", initialData.nftItem);
        console.log("hasNftOnly", hasNftOnly);

        // Gérer la suppression du PhysicalItem si l'option a été décochée
        if (initialData.physicalItem && !hasPhysicalOnly) {
          try {
            console.log("3");
            const physicalItemId = initialData.physicalItem.id;
            if (physicalItemId) {
              await deletePhysicalItem(physicalItemId);
              console.log("PhysicalItem supprimé:", physicalItemId);
            } else {
              console.log("Impossible de supprimer PhysicalItem: ID manquant");
            }
          } catch (error) {
            console.error(
              "Erreur lors de la suppression du PhysicalItem:",
              error
            );
            errorToast("Erreur lors de la suppression de l'item physique");
          }
        }
      }

      // Appeler la fonction onSubmit originale
      await originalOnSubmit(data);
    } catch (error) {
      console.error("Erreur lors de la soumission du formulaire:", error);
      errorToast("Une erreur est survenue lors de la soumission du formulaire");
    }
  };

  // Préparer le contenu des onglets
  const collectionTabContent = (
    <div className="w-full space-y-6">
      <CollectionSection
        register={register}
        errors={errors}
        isFormReadOnly={isFormReadOnly || !!readOnlyCollectionId}
        collections={collections}
        readOnlyCollectionId={readOnlyCollectionId}
        setValue={setValue}
      />
    </div>
  );

  const characteristicsTabContent = (
    <div className="w-full space-y-6">
      {/* Section: Caractéristiques principales */}
      <div className="space-y-4">
        <MainInfoSection
          register={register}
          errors={errors}
          setValue={setValue}
          control={control}
          getValues={getValues}
          slug={localSlug}
          title={localTitle}
          onNameChange={handleNameChange}
          isFormReadOnly={isFormReadOnly}
        />

        {/* Section SEO masquée */}
        {/* <SeoSection
        register={register} 
        errors={errors}
        setValue={setValue} 
        control={control}
        getValues={getValues}
        isFormReadOnly={isFormReadOnly}
        /> */}

        {/* Section: Caractéristiques artistiques */}
        <ArtworkCharacteristicsSection
          register={register}
          errors={errors}
          setValue={setValue}
          control={control}
          getValues={getValues}
          isFormReadOnly={isFormReadOnly}
          mediums={mediums}
          styles={artStyles}
          techniques={techniques}
          themes={themes}
        />

        {/* Section de tarification - masquée pour les œuvres physiques et en mode édition */}
        {!isPhysicalOnly && mode !== "edit" && (
          <PricingSection
            register={register}
            errors={errors}
            setValue={setValue}
            control={control}
            getValues={getValues}
            hasPhysicalOnly={hasPhysicalOnly}
            hasNftOnly={hasNftOnly}
            hasNftPlusPhysical={hasNftPlusPhysical}
            onPricingOptionChange={handlePricingOptionChange}
            isEditMode={isEditMode}
            physicalItemStatus={physicalItemStatus}
            nftItemStatus={nftItemStatus}
            isFormReadOnly={isFormReadOnly}
            isPhysicalOnly={isPhysicalOnly}
          />
        )}
      </div>

      {/* Section: Caractéristiques physiques */}
      {(hasPhysicalOnly || isPhysicalOnly) && (
        <div className="space-y-4">
          <PhysicalPropertiesSection
            register={register}
            errors={errors}
            setValue={setValue}
            control={control}
            getValues={getValues}
            isFormReadOnly={isFormReadOnly}
            supports={supports}
          />

          <ShippingAddressSection
            register={register}
            errors={errors}
            setValue={setValue}
            control={control}
            getValues={getValues}
            isFormReadOnly={isFormReadOnly}
            addresses={addresses}
          />
        </div>
      )}

      {/* Section commune pour les tags - masquée */}
      {/* <TagsSection
        register={register}
        errors={errors}
        setValue={setValue}
        control={control}
        getValues={getValues}
        tags={tags}
        setTags={setTags}
        isFormReadOnly={isFormReadOnly}
      /> */}

      {/* Conditionnellement afficher la section des propriétés NFT basé uniquement sur l'état de la checkbox */}
      {hasNftOnly && (
        <NftPropertiesSection
          register={register}
          errors={errors}
          setValue={setValue}
          control={control}
          getValues={getValues}
          isFormReadOnly={isFormReadOnly}
        />
      )}
    </div>
  );

  const visualTabContent = (
    <div className="w-full space-y-6">
      {/* Section: Fichiers Media */}
      <MediaFilesSection
        register={register}
        errors={errors}
        setValue={setValue}
        control={control}
        getValues={getValues}
        isEditMode={isEditMode}
        initialImageUrl={initialData?.imageUrl}
        fileInputRef={fileInputRef}
        secondaryImagesInputRef={secondaryImagesInputRef}
        handleImageChange={handleImageChange}
        handleSecondaryImagesChange={handleSecondaryImagesChange}
        isFormReadOnly={isFormReadOnly}
        artistName={artistName}
        artistSurname={artistSurname}
        artworkName={localTitle}
        onMainImageUploaded={(imageUrl) => {
          setValue("mainImageUrl", imageUrl, { shouldValidate: true });
        }}
        physicalItemId={initialData?.physicalItem?.id}
        initialImagesByType={initialData?.imagesByType}
        pendingImagesByTypeRef={pendingImagesByTypeRef}
        removedImagesByTypeRef={removedImagesByTypeRef}
      />

      {/* Section certificat pour œuvre physique - masquée */}
      {/* {(hasPhysicalOnly || isPhysicalOnly) && (
        <PhysicalCertificateSection 
          register={register} 
          errors={errors}
          setValue={setValue}
          control={control}
          getValues={getValues}
          isEditMode={isEditMode}
          certificateUrl={initialData?.physicalCertificateUrl}
          fileInputRef={physicalCertificateInputRef}
          handleCertificateChange={handlePhysicalCertificateChange}
          isFormReadOnly={isFormReadOnly}
        />
      )} */}

      {/* Section certificat pour NFT */}
      {hasNftOnly && (
        <NftCertificateSection
          register={register}
          errors={errors}
          setValue={setValue}
          control={control}
          getValues={getValues}
          isEditMode={isEditMode}
          certificateUrl={initialData?.nftCertificateUrl}
          fileInputRef={nftCertificateInputRef}
          handleCertificateChange={handleNftCertificateChange}
          isFormReadOnly={isFormReadOnly}
        />
      )}

      {/* Prévisualisations des images secondaires */}
      {secondaryImages.length > 0 && (
        <div className="mt-4">
          <ImagePreview
            images={secondaryImages}
            label={
              secondaryImages.length > 0
                ? `Images secondaires existantes (${secondaryImages.length})`
                : ""
            }
            onRemove={!isFormReadOnly ? removeSecondaryImage : undefined}
            isExistingImage={isExistingImage}
          />
        </div>
      )}

      {/* Prévisualisation du certificat d'œuvre physique */}
      {(hasPhysicalOnly || isPhysicalOnly) &&
        (previewPhysicalCertificate || initialData?.physicalCertificateUrl) && (
          <div className="mt-4 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Certificat d'œuvre physique
            </h4>
            <div className="flex flex-col items-center">
              {previewPhysicalCertificate ? (
                <PdfPreview
                  url={previewPhysicalCertificate}
                  certificateFile={
                    physicalCertificateInputRef.current?.files?.[0] || null
                  }
                />
              ) : initialData?.physicalCertificateUrl ? (
                <a
                  href={initialData.physicalCertificateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 text-primary underline hover:text-primary-dark"
                >
                  Voir le certificat d'œuvre physique existant
                </a>
              ) : null}
            </div>
          </div>
        )}

      {/* Prévisualisation du certificat NFT */}
      {hasNftOnly &&
        (previewNftCertificate || initialData?.nftCertificateUrl) && (
          <div className="mt-4 bg-gray-50 dark:bg-gray-800/50 p-6 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              Certificat NFT
            </h4>
            <div className="flex flex-col items-center">
              {previewNftCertificate ? (
                <PdfPreview
                  url={previewNftCertificate}
                  certificateFile={
                    nftCertificateInputRef.current?.files?.[0] || null
                  }
                />
              ) : initialData?.nftCertificateUrl ? (
                <a
                  href={initialData.nftCertificateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 text-primary underline hover:text-primary-dark"
                >
                  Voir le certificat NFT existant
                </a>
              ) : null}
            </div>
          </div>
        )}
    </div>
  );

  const tabs = [
    {
      id: "collection",
      label: "Collection",
      content: collectionTabContent,
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      ),
    },
    {
      id: "characteristics",
      label: "Caractéristiques de l'oeuvre",
      content: characteristicsTabContent,
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      id: "visual",
      label: "Visuel de l'oeuvre",
      content: visualTabContent,
      icon: (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
    },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="w-full">
      {isFormReadOnly && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm font-medium text-amber-800 dark:text-amber-200">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
            <span>
              Au moins un élément est listé, vous ne pouvez pas modifier
              l'œuvre.
            </span>
          </div>
        </div>
      )}

      {/* Onglets du formulaire */}
      <ArtworkTabs
        tabs={tabs}
        defaultTabId="collection"
        activeTabId={activeTabId}
        onTabChange={setActiveTabId}
      />

      {/* Modal d'erreurs de validation */}
      <ValidationErrorsModal
        isOpen={showValidationModal}
        onClose={() => setShowValidationModal(false)}
        errors={errors}
        onNavigateToTab={(tabId) => {
          setActiveTabId(tabId);
          setShowValidationModal(false);
          // Scroll vers le champ en erreur après un court délai
          setTimeout(() => {
            const firstErrorField = Object.keys(errors)[0];
            const element = document.getElementById(firstErrorField);
            if (element) {
              element.scrollIntoView({ behavior: "smooth", block: "center" });
              element.focus();
            }
          }, 100);
        }}
      />

      {/* Modal de progression */}
      <ProgressModal
        isOpen={showProgressModal}
        steps={progressSteps}
        currentError={progressError}
        onClose={() => {
          setShowProgressModal(false);
          setProgressError(undefined);
        }}
        title={
          mode === "edit" ? "Mise à jour de l'œuvre" : "Création de l'œuvre"
        }
      />

      {/* Actions du formulaire - Toujours visibles en bas */}
      <div className="flex justify-end gap-4 mt-10 pt-8 border-t-2 border-gray-200 dark:border-gray-700 pl-6 sm:pl-8 md:pl-10 pr-6 sm:pr-8 md:pr-10">
        <Button
          type="button"
          variant="secondary"
          size="medium"
          onClick={() => router.back()}
          className="min-w-[120px]"
        >
          Annuler
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="medium"
          disabled={isSubmitting}
          isLoading={isSubmitting}
          loadingText="Traitement en cours..."
          className="min-w-[160px]"
          onClick={(e) => {
            // Debug: vérifier l'état du formulaire
            console.log("Bouton cliqué - isSubmitting:", isSubmitting);
            console.log("Erreurs de validation:", errors);
            console.log("Nombre d'erreurs:", Object.keys(errors).length);
            console.log("Valeurs du formulaire:", getValues());
            console.log(
              "styleIds:",
              getValues("styleIds"),
              "techniqueIds:",
              getValues("techniqueIds")
            );
          }}
        >
          {isEditMode ? "Mettre à jour" : "Créer l'œuvre"}
        </Button>
      </div>
    </form>
  );
}
