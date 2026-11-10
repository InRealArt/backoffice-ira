"use client";

import { useState, useEffect } from "react";
import ArtworkForm from "../components/ArtworkForm";
import styles from "./createPhysicalArtwork.module.scss";
import { authClient } from "@/lib/auth-client";
import {
  getBackofficeUserByEmail,
  getBackofficeUserAddresses,
} from "@/lib/actions/prisma-actions";
import { getPhysicalCollectionsWithItems } from "@/lib/actions/physical-collection-actions";
import { useRouter, useSearchParams } from "next/navigation";
import { Address, PhysicalCollection } from "../components/ArtworkForm/types";
import { FormCard, FormPage, FormPageHeader } from "@/app/components/Forms/FormKit/FormKit";
import {
  ArtworkMedium,
  ArtworkStyle,
  ArtworkTechnique,
  ArtworkTheme,
  ArtworkSupport,
} from "@/src/generated/prisma/client";

interface CreatePhysicalArtworkClientProps {
  mediums: ArtworkMedium[];
  styles: ArtworkStyle[];
  techniques: ArtworkTechnique[];
  themes: ArtworkTheme[];
  supports: ArtworkSupport[];
}

export default function CreatePhysicalArtworkClient({
  mediums,
  styles: artStyles,
  techniques,
  themes,
  supports,
}: CreatePhysicalArtworkClientProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [artistName, setArtistName] = useState("");
  const [artistSurname, setArtistSurname] = useState("");
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [collections, setCollections] = useState<PhysicalCollection[]>([]);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const collectionIdFromUrl = searchParams.get("collectionId");

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);

    return () => {
      window.removeEventListener("resize", checkIfMobile);
    };
  }, []);

  useEffect(() => {
    // Attendre que la session soit chargée
    if (isSessionPending) {
      return;
    }

    const fetchData = async () => {
      if (session?.user?.email) {
        try {
          // Récupérer les informations utilisateur, les adresses et les collections en parallèle
          const [backofficeUser, userAddresses, userCollections] =
            await Promise.all([
              getBackofficeUserByEmail(session.user.email),
              getBackofficeUserAddresses(session.user.email),
              getPhysicalCollectionsWithItems(),
            ]);

          if (backofficeUser) {
            // Utiliser firstName et lastName pour composer le nom complet
            setArtistName(backofficeUser.artist?.name || "");
            setArtistSurname(backofficeUser.artist?.surname || "");
          }

          setAddresses(userAddresses);
          setCollections(
            userCollections.map((col) => ({
              id: col.id,
              name: col.name,
              description: col.description,
              landingArtistId: col.landingArtistId,
            }))
          );
        } catch (error) {
          console.error("Erreur lors de la récupération des données:", error);
        } finally {
          setIsLoadingAddresses(false);
        }
      }
    };

    fetchData();
  }, [session?.user?.email, isSessionPending]);

  const handleSuccess = () => {
    router.push("/art/myPhysicalArtwork");
  };

  return (
    <FormPage wide>
      <FormPageHeader
        eyebrow={artistName || null}
        title="Créer une œuvre physique"
        subtitle="Ajoutez une nouvelle œuvre physique à la collection de votre artiste."
      />

      <FormCard>
        <ArtworkForm
          mode="create"
          addresses={addresses}
          mediums={mediums}
          styles={artStyles}
          techniques={techniques}
          themes={themes}
          supports={supports}
          collections={collections}
          artistName={artistName}
          artistSurname={artistSurname}
          onSuccess={handleSuccess}
          isPhysicalOnly={true}
          initialData={
            collectionIdFromUrl
              ? {
                  physicalItem: {
                    physicalCollectionId: parseInt(collectionIdFromUrl, 10),
                  },
                }
              : {}
          }
          readOnlyCollectionId={
            collectionIdFromUrl ? parseInt(collectionIdFromUrl, 10) : undefined
          }
        />
      </FormCard>
    </FormPage>
  );
}
