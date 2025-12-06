"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import LoadingSpinner from "@/app/components/LoadingSpinner/LoadingSpinner";
import ArtworkForm from "@/app/(protected)/art/components/ArtworkForm";
import {
  getItemById,
  getBackofficeUserAddresses,
  getPhysicalCertificateByItemId,
  getBackofficeUserByEmail,
} from "@/lib/actions/prisma-actions";
import { getPhysicalCollectionsWithItems } from "@/lib/actions/physical-collection-actions";
import { use } from "react";
import { normalizeString } from "@/lib/utils";
import {
  Address,
  PhysicalCollection,
} from "@/app/(protected)/art/components/ArtworkForm/types";
import {
  ArtworkMedium,
  ArtworkStyle,
  ArtworkTechnique,
  ArtworkTheme,
  ArtworkSupport,
} from "@prisma/client";

interface EditPhysicalArtworkClientProps {
  params: Promise<{ id: string }>;
  mediums: ArtworkMedium[];
  styles: ArtworkStyle[];
  techniques: ArtworkTechnique[];
  themes: ArtworkTheme[];
  supports: ArtworkSupport[];
}

export default function EditPhysicalArtworkClient({
  params,
  mediums,
  styles: artStyles,
  techniques,
  themes,
  supports,
}: EditPhysicalArtworkClientProps) {
  // Utiliser React.use pour extraire les paramètres de la promesse
  const resolvedParams = use(params);

  const [item, setItem] = useState<any>(null);
  const [certificate, setCertificate] = useState<any>(null);
  const [physicalCertificate, setPhysicalCertificate] = useState<any>(null);
  const [nftCertificate, setNftCertificate] = useState<any>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [collections, setCollections] = useState<PhysicalCollection[]>([]);
  const [artistName, setArtistName] = useState("");
  const [artistSurname, setArtistSurname] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const router = useRouter();

  useEffect(() => {
    // Attendre que la session soit chargée
    if (isSessionPending) {
      return;
    }

    if (!session?.user?.email) {
      setError("Utilisateur non connecté");
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const fetchItem = async () => {
      try {
        const itemId = parseInt(resolvedParams.id);

        if (isNaN(itemId)) {
          throw new Error("ID d'item invalide");
        }

        // Récupérer l'item, les adresses, les collections et l'utilisateur en parallèle
        const [itemData, userAddresses, userCollections, backofficeUser] =
          await Promise.all([
            getItemById(itemId),
            getBackofficeUserAddresses(session.user.email!),
            getPhysicalCollectionsWithItems(),
            getBackofficeUserByEmail(session.user.email!),
          ]);

        if (isMounted) {
          if (itemData) {
            setItem(itemData);
            setAddresses(userAddresses);

            // Récupérer les collections
            setCollections(
              userCollections.map((col) => ({
                id: col.id,
                name: col.name,
                description: col.description,
                landingArtistId: col.landingArtistId,
              }))
            );

            // Récupérer le nom de l'artiste
            if (backofficeUser) {
              setArtistName(backofficeUser.artist?.name || "");
              setArtistSurname(backofficeUser.artist?.surname || "");
            }

            // Vérifier les valeurs reçues
            console.log("Item chargé pour l'édition:", {
              id: itemData.id,
              name: itemData.name,
              description: itemData.description,
              mainImageUrl: itemData.mainImageUrl,
              secondaryImagesUrl: itemData.secondaryImagesUrl,
              // Vérifier si l'item a des relations
              hasPhysicalItem: !!itemData.physicalItem,
              hasNftItem: !!itemData.nftItem,
              // Vérifier les caractéristiques artistiques
              physicalItemThemes: itemData.physicalItem?.itemThemes,
              physicalItemStyles: itemData.physicalItem?.itemStyles,
              physicalItemTechniques: itemData.physicalItem?.itemTechniques,
              // Afficher l'objet complet pour debugging
              itemComplet: itemData,
            });

            // Récupérer les certificats en parallèle
            const certificatePromises = [];

            // Certificat d'œuvre physique
            if (itemData.physicalItem) {
              certificatePromises.push(
                getPhysicalCertificateByItemId(itemData.id).catch((error) => {
                  console.error(
                    "Erreur lors de la récupération du certificat d'œuvre physique:",
                    error
                  );
                  return null;
                })
              );
            } else {
              certificatePromises.push(Promise.resolve(null));
            }

            try {
              const [physicalCertificateResult] = await Promise.all(
                certificatePromises
              );

              if (physicalCertificateResult) {
                console.log(
                  "Certificat d'œuvre physique trouvé:",
                  physicalCertificateResult
                );
                setPhysicalCertificate(physicalCertificateResult);
              }
            } catch (certError) {
              console.error(
                "Erreur lors de la récupération des certificats:",
                certError
              );
            }
          } else {
            setError("Œuvre introuvable");
          }
          setIsLoading(false);
        }
      } catch (error: any) {
        console.error("Erreur lors du chargement de l'item:", error);
        if (isMounted) {
          setError(error.message || "Une erreur est survenue");
          setIsLoading(false);
        }
      }
    };

    fetchItem();

    return () => {
      isMounted = false;
    };
  }, [session?.user?.email, resolvedParams.id, isSessionPending]);

  const handleSuccess = () => {
    router.push("/art/myPhysicalArtwork");
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-7xl mx-auto flex items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="mb-8 pb-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Modifier une œuvre physique
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400">
            Modifiez les informations de l'œuvre de{" "}
            <span className="font-semibold text-primary dark:text-primary">
              {artistName || "votre artiste"}
            </span>
          </p>
        </div>
      </div>

      {error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg mb-6">
          {error}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 pt-6 sm:pt-8 md:pt-10 pr-6 sm:pr-8 md:pr-10 pb-6 sm:pb-8 md:pb-10 overflow-hidden">
          <ArtworkForm
            mode="edit"
            addresses={addresses}
            mediums={mediums}
            styles={artStyles}
            techniques={techniques}
            themes={themes}
            supports={supports}
            collections={collections}
            artistName={artistName}
            artistSurname={artistSurname}
            isPhysicalOnly={true}
            initialData={{
              id: item.id,
              title: item.name,
              description: item.description,
              metaTitle: item.metaTitle,
              metaDescription: item.metaDescription,
              slug: item.slug || (item.name ? normalizeString(item.name) : ""),
              imageUrl: item.mainImageUrl,
              secondaryImagesUrl: item.secondaryImagesUrl || [],
              // Caractéristiques artistiques depuis PhysicalItem
              mediumId: item.physicalItem?.mediumId,
              supportId: item.physicalItem?.supportId,
              styleIds:
                item.physicalItem?.itemStyles?.map((is: any) => is.styleId) ||
                [],
              techniqueIds:
                item.physicalItem?.itemTechniques?.map(
                  (it: any) => it.techniqueId
                ) || [],
              themeIds:
                item.physicalItem?.itemThemes?.map((ith: any) => ith.themeId) ||
                [],
              // Transmettre les données du physicalItem s'il existe
              physicalItem: item.physicalItem
                ? {
                    id: item.physicalItem.id,
                    price: item.physicalItem.price,
                    initialQty: item.physicalItem.initialQty,
                    stockQty: item.physicalItem.stockQty,
                    height: item.physicalItem.height,
                    width: item.physicalItem.width,
                    weight: item.physicalItem.weight,
                    creationYear: item.physicalItem.creationYear,
                    status: item.physicalItem.status,
                    shippingAddressId: item.physicalItem.shippingAddressId,
                    physicalCollectionId:
                      item.physicalItem.physicalCollectionId,
                    mediumId: item.physicalItem.mediumId,
                    supportId: item.physicalItem.supportId,
                    itemStyles: item.physicalItem.itemStyles || [],
                    itemTechniques: item.physicalItem.itemTechniques || [],
                    itemThemes: item.physicalItem.itemThemes || [],
                  }
                : null,
              // Transmettre les données du nftItem s'il existe
              nftItem: item.nftItem
                ? {
                    id: item.nftItem.id,
                    price: item.nftItem.price,
                    status: item.nftItem.status,
                  }
                : null,
              // Transmettre le certificat d'authenticité s'il existe (pour rétrocompatibilité)
              certificateUrl: certificate?.fileUrl || null,
              // Transmettre les nouveaux certificats
              physicalCertificateUrl: physicalCertificate?.fileUrl || null,
              nftCertificateUrl: nftCertificate?.fileUrl || null,
            }}
            onSuccess={handleSuccess}
          />
        </div>
      )}
    </div>
  );
}
