"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { authClient } from "@/lib/auth-client";
import Button from "@/app/components/Button/Button";
import { useToast } from "@/app/components/Toast/ToastContext";
import { InputField } from "@/app/components/Forms/InputField";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { success: successToast, error: errorToast } = useToast();

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setError("Le lien de réinitialisation est invalide ou a expiré");
      errorToast("Le lien de réinitialisation est invalide ou a expiré");
    } else if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError("Token manquant dans l'URL");
      errorToast("Lien de réinitialisation invalide");
    }
  }, [searchParams, errorToast]);

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);
      setIsLoading(true);

      // Validation
      if (!newPassword || newPassword.length < 8) {
        setError("Le mot de passe doit contenir au moins 8 caractères");
        setIsLoading(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        setError("Les mots de passe ne correspondent pas");
        setIsLoading(false);
        return;
      }

      if (!token) {
        setError("Token manquant");
        setIsLoading(false);
        return;
      }

      try {
        const { error: resetError } = await authClient.resetPassword({
          newPassword,
          token,
        });

        if (resetError) {
          setError(resetError.message || "Erreur lors de la réinitialisation");
          errorToast(
            resetError.message || "Erreur lors de la réinitialisation"
          );
          setIsLoading(false);
          return;
        }

        setIsSuccess(true);
        successToast("Mot de passe réinitialisé avec succès !");

        // Rediriger vers la page de connexion après 2 secondes
        setTimeout(() => {
          router.push("/sign-in");
        }, 2000);
      } catch (err: any) {
        setError(err.message || "Une erreur est survenue");
        errorToast(err.message || "Une erreur est survenue");
        setIsLoading(false);
      }
    },
    [newPassword, confirmPassword, token, router, successToast, errorToast]
  );

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card w-full max-w-md bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="flex items-center justify-center gap-3 mb-6 pb-6 border-b border-base-300">
              <div className="bg-black rounded-md p-1 flex items-center justify-center w-[70px] h-[70px]">
                <Image
                  src="/img/Logo_InRealArt.svg"
                  alt="InRealArt Logo"
                  width={60}
                  height={60}
                  className="logo-image"
                />
              </div>
              <span className="text-xl font-semibold text-gray-900 dark:text-white">
                InRealArt backoffice
              </span>
            </div>

            <div className="text-center">
              <div className="mb-4">
                <svg
                  className="mx-auto h-16 w-16 text-success"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>

              <h2 className="card-title text-2xl justify-center mb-4">
                Mot de passe réinitialisé !
              </h2>

              <p className="text-base-content/70 mb-6">
                Votre mot de passe a été réinitialisé avec succès. Vous allez
                être redirigé vers la page de connexion...
              </p>

              <Button
                variant="primary"
                size="medium"
                onClick={() => router.push("/sign-in")}
              >
                Aller à la connexion
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!token && !error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="card w-full max-w-md bg-base-100 shadow-xl">
          <div className="card-body">
            <div className="text-center">
              <span className="loading loading-spinner loading-lg"></span>
              <p className="mt-4">Chargement...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="card w-full max-w-md bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex items-center justify-center gap-3 mb-6 pb-6 border-b border-base-300">
            <div className="bg-black rounded-md p-1 flex items-center justify-center w-[70px] h-[70px]">
              <Image
                src="/img/Logo_InRealArt.svg"
                alt="InRealArt Logo"
                width={60}
                height={60}
                className="logo-image"
              />
            </div>
            <span className="text-xl font-semibold text-gray-900 dark:text-white">
              InRealArt backoffice
            </span>
          </div>

          <h2 className="card-title text-2xl">Réinitialiser le mot de passe</h2>
          <p className="text-base-content/70 mb-6">
            Entrez votre nouveau mot de passe ci-dessous.
          </p>

          {error && (
            <div className="alert alert-error mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="stroke-current shrink-0 h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-5">
            <InputField
              id="newPassword"
              name="newPassword"
              label="Nouveau mot de passe"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Saisissez votre nouveau mot de passe"
              required
              error={error && !newPassword ? "Ce champ est requis" : undefined}
              showErrorsOnlyAfterSubmit={false}
            />

            <InputField
              id="confirmPassword"
              name="confirmPassword"
              label="Confirmer le mot de passe"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirmez votre nouveau mot de passe"
              required
              error={
                error && newPassword !== confirmPassword
                  ? "Les mots de passe ne correspondent pas"
                  : undefined
              }
              showErrorsOnlyAfterSubmit={false}
            />

            <div className="form-control mt-2">
              <Button
                variant="primary"
                size="medium"
                isLoading={isLoading}
                loadingText="Réinitialisation..."
                type="submit"
                disabled={!token}
              >
                Réinitialiser le mot de passe
              </Button>
            </div>
          </form>

          <p className="text-sm mt-4 text-center">
            <Link href="/sign-in" className="link link-primary">
              Retour à la connexion
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="card w-full max-w-md bg-base-100 shadow-xl">
            <div className="card-body">
              <div className="text-center">
                <span className="loading loading-spinner loading-lg"></span>
                <p className="mt-4">Chargement...</p>
              </div>
            </div>
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
