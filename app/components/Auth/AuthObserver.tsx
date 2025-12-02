"use client";

import { useEffect, useState, useRef } from "react";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { useToast } from "@/app/components/Toast/ToastContext";
import WalletEventListener from "./WalletEventListener";
import { useAuthorization } from "@/app/hooks/useAuthorization";

export default function AuthObserver() {
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const isLoggedIn = !!session;
  const router = useRouter();
  const [previousLoginState, setPreviousLoginState] = useState(false);
  const { error: errorToast } = useToast();

  // Utiliser le hook optimisé SANS redirection automatique
  // La redirection est gérée par les pages individuelles (comme page.tsx)
  // Ce composant vérifie juste l'autorisation pour afficher les messages d'erreur
  const { isAuthorized } = useAuthorization({
    redirectIfUnauthorized: false,
    disabled: false, // Activer la vérification automatique
  });

  // Utiliser useRef pour router afin d'éviter les dépendances instables
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  // Gérer la redirection et le message d'erreur si non autorisé
  useEffect(() => {
    if (isLoggedIn && isAuthorized === false) {
      errorToast("Vous n'êtes pas autorisé à accéder à cette application");
    }
  }, [isLoggedIn, isAuthorized, errorToast]);

  // Rediriger vers la page d'accueil lorsque l'utilisateur se déconnecte
  useEffect(() => {
    if (previousLoginState && !isLoggedIn && !isSessionPending) {
      routerRef.current.push("/");
    }

    // Mettre à jour l'état précédent
    setPreviousLoginState(isLoggedIn);
  }, [isLoggedIn, previousLoginState, isSessionPending]);

  return <>{isLoggedIn && <WalletEventListener />}</>;
}
