"use client";

import { useState, useEffect } from "react";
import { authClient } from "@/lib/auth-client";
import LoadingSpinner from "@/app/components/LoadingSpinner/LoadingSpinner";
import { ArtistAddress } from "@prisma/client";
import { getBackofficeUserByEmail } from "@/lib/actions/prisma-actions";
import { getAddresses } from "@/lib/actions/address-actions";
import Link from "next/link";
import { useRouter } from "next/navigation";

type BackofficeUserResult = Awaited<
  ReturnType<typeof getBackofficeUserByEmail>
>;

export default function AddressesPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [addresses, setAddresses] = useState<ArtistAddress[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userDB, setUserDB] = useState<BackofficeUserResult>(null);
  const [isAddingAddress, setIsAddingAddress] = useState(false);
  const [navigatingToAddressId, setNavigatingToAddressId] = useState<
    number | null
  >(null);

  useEffect(() => {
    // Attendre que la session soit chargée
    if (isSessionPending) {
      return;
    }

    if (!session?.user?.email) {
      setIsLoading(false);
      setError("Vous devez être connecté pour voir vos adresses");
      return;
    }

    let isMounted = true;

    const loadData = async () => {
      const email = session.user.email as string;
      const userDBResult = await getBackofficeUserByEmail(email);

      if (!userDBResult) {
        setError("Votre profil utilisateur n'a pas été trouvé");
        setIsLoading(false);
        return;
      }

      setUserDB(userDBResult);

      // Récupérer les adresses de l'utilisateur connecté
      const addressesResult = await getAddresses(userDBResult.id as string);

      if (isMounted) {
        if (!addressesResult.success) {
          setError(
            addressesResult.error ||
              "Une erreur est survenue lors de la récupération de vos adresses"
          );
        } else {
          setAddresses(addressesResult.data || []);
        }
        setIsLoading(false);
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [session?.user?.email, isSessionPending]);

  const handleAddAddressClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsAddingAddress(true);
    setTimeout(() => {
      router.push("/art/addresses/create");
    }, 500);
  };

  const handleEditAddressClick = (addressId: number) => {
    setNavigatingToAddressId(addressId);
    setTimeout(() => {
      router.push(`/art/addresses/${addressId}/edit`);
    }, 500);
  };

  if (isLoading) {
    return <LoadingSpinner message="Chargement de vos adresses..." />;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="header-top-section">
          <h1 className="page-title">Mes Adresses</h1>
          <button
            onClick={handleAddAddressClick}
            disabled={isAddingAddress}
            className="btn btn-primary btn-small"
          >
            {isAddingAddress
              ? "Redirection en cours..."
              : "Ajouter une adresse"}
          </button>
        </div>
        <p className="page-subtitle">
          Liste des adresses associées à votre compte{" "}
          {userDB?.name || session?.user?.email}
        </p>
      </div>

      <div className="page-content">
        {error ? (
          <div className="alert alert-error">{error}</div>
        ) : !addresses || addresses.length === 0 ? (
          <div className="empty-state">
            <p>Aucune adresse trouvée</p>
            <button
              onClick={handleAddAddressClick}
              disabled={isAddingAddress}
              className="btn btn-primary btn-medium mt-4"
            >
              {isAddingAddress
                ? "Redirection en cours..."
                : "Ajouter une adresse"}
            </button>
          </div>
        ) : (
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nom</th>
                  <th>Adresse</th>
                  <th>Code postal / Ville</th>
                  <th>Pays</th>
                  <th>Nom de l'adresse</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {addresses.map((address) => {
                  const isNavigating = navigatingToAddressId === address.id;
                  const isDisabled =
                    isAddingAddress || navigatingToAddressId !== null;

                  return (
                    <tr
                      key={address.id}
                      className={`clickable-row ${
                        isNavigating ? "loading-row" : ""
                      } ${isDisabled && !isNavigating ? "disabled-row" : ""}`}
                    >
                      <td>{address.lastName}</td>
                      <td>{address.streetAddress}</td>
                      <td>
                        {address.postalCode} {address.city}
                      </td>
                      <td>{address.country}</td>
                      <td>{address.name || "-"}</td>
                      <td className="text-right">
                        <button
                          onClick={() => handleEditAddressClick(address.id)}
                          className="btn btn-primary btn-small"
                          disabled={isDisabled}
                        >
                          {isNavigating ? (
                            <LoadingSpinner size="small" message="" inline />
                          ) : (
                            "Modifier"
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
