"use client";

import { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import Button from "@/app/components/Button/Button";
import AuthShell, { AuthAlert, AuthField, AuthSuccess } from "@/app/components/AuthShell/AuthShell";

const MIN_PASSWORD_LENGTH = 8;

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Annule la redirection différée si l'utilisateur quitte la page avant
  useEffect(() => () => {
    if (redirectTimer.current) clearTimeout(redirectTimer.current);
  }, []);

  useEffect(() => {
    const tokenParam = searchParams.get("token");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setError("Le lien de réinitialisation est invalide ou a expiré.");
    } else if (tokenParam) {
      setToken(tokenParam);
    } else {
      setError("Lien de réinitialisation invalide : le jeton est manquant.");
    }
  }, [searchParams]);

  const onSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setError(null);
      setPasswordError(null);
      setConfirmError(null);

      if (newPassword.length < MIN_PASSWORD_LENGTH) {
        setPasswordError(`Le mot de passe doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`);
        return;
      }

      if (newPassword !== confirmPassword) {
        setConfirmError("Les mots de passe ne correspondent pas.");
        return;
      }

      if (!token) {
        setError("Lien de réinitialisation invalide : le jeton est manquant.");
        return;
      }

      setIsLoading(true);
      try {
        const { error: resetError } = await authClient.resetPassword({
          newPassword,
          token,
        });

        if (resetError) {
          setError(resetError.message || "Erreur lors de la réinitialisation");
          setIsLoading(false);
          return;
        }

        setIsSuccess(true);

        // Rediriger vers la page de connexion après 2 secondes
        redirectTimer.current = setTimeout(() => {
          router.push("/sign-in");
        }, 2000);
      } catch (err: any) {
        setError(err.message || "Une erreur est survenue");
        setIsLoading(false);
      }
    },
    [newPassword, confirmPassword, token, router]
  );

  if (isSuccess) {
    return (
      <AuthShell title="Mot de passe mis à jour">
        <AuthSuccess title="Mot de passe réinitialisé">
          <p>
            Votre mot de passe a été modifié. Vous allez être redirigé vers la page de connexion…
          </p>
          <Button
            variant="primary"
            size="medium"
            onClick={() => {
              if (redirectTimer.current) clearTimeout(redirectTimer.current);
              router.push("/sign-in");
            }}
          >
            Aller à la connexion
          </Button>
        </AuthSuccess>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Nouveau mot de passe"
      subtitle="Choisissez un nouveau mot de passe pour votre compte."
      footer={
        <>
          {!token && error ? (
            <p>
              <Link href="/forgot-password">Demander un nouveau lien</Link>
            </p>
          ) : null}
          <p>
            <Link href="/sign-in">Retour à la connexion</Link>
          </p>
        </>
      }
    >
      <form onSubmit={onSubmit}>
        <AuthField
          id="newPassword"
          label="Nouveau mot de passe"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          autoComplete="new-password"
          hint={`${MIN_PASSWORD_LENGTH} caractères minimum.`}
          error={passwordError}
        />
        <AuthField
          id="confirmPassword"
          label="Confirmer le mot de passe"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          autoComplete="new-password"
          error={confirmError}
        />
        {error ? <AuthAlert>{error}</AuthAlert> : null}
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
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}
