"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import Navbar from "../components/Navbar/Navbar";
import AuthObserver from "../components/Auth/AuthObserver";
import LandingHero from "../components/LandingHero/LandingHero";
import LoadingSpinner from "../components/LoadingSpinner/LoadingSpinner";
import { authClient } from "@/lib/auth-client";
import { useAuthorization } from "../hooks/useAuthorization";

const checkIsDarkSchemePreferred = () => {
  if (typeof window !== "undefined") {
    return window.matchMedia?.("(prefers-color-scheme:dark)")?.matches ?? false;
  }
  return false;
};

export default function Main() {
  const router = useRouter();
  const t = useTranslations("home");
  const [isDarkMode, setIsDarkMode] = useState(checkIsDarkSchemePreferred);
  const { data: session, isPending: isSessionPending } =
    authClient.useSession();
  const isLoggedIn = !!session;

  // Utiliser le hook optimisé avec redirection automatique
  const { isAuthorized, isLoading: isAuthLoading } = useAuthorization({
    redirectIfAuthorized: true,
    redirectPath: "/dashboard",
  });

  // Calculer l'état de chargement global
  const isLoading = useMemo(
    () => isSessionPending || isAuthLoading,
    [isSessionPending, isAuthLoading]
  );

  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia(
      "(prefers-color-scheme: dark)"
    );
    const handleChange = () => setIsDarkMode(checkIsDarkSchemePreferred());

    darkModeMediaQuery.addEventListener("change", handleChange);
    return () => darkModeMediaQuery.removeEventListener("change", handleChange);
  }, []);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <LoadingSpinner message={t("checkingAccess")} />
      </>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col items-center justify-center bg-background-main text-text-primary transition-colors duration-300 ${
        isDarkMode ? "dark" : ""
      }`}
    >
      <AuthObserver />
      <Navbar />
      <div className="absolute top-0 flex items-center justify-between w-full px-4 py-2.5 dark:border-b dark:border-border">
        {/*
        <img 
          className="pl-4 h-[30px]" 
          src={isDarkMode ? "/logo-light.png" : "/logo-dark.png"} 
          alt="dynamic" 
        />
        <div className="flex gap-2.5 pr-4">
          <button 
            className="px-5 py-2.5 rounded-xl border border-text-primary bg-transparent text-text-primary font-bold transition-colors duration-300 dark:border-white dark:text-white"
            onClick={() => window.open('https://docs.dynamic.xyz', '_blank', 'noopener,noreferrer')}
          >
            Docs
          </button>
          <button 
            className="px-5 py-2.5 rounded-xl border-none bg-primary text-white font-bold cursor-pointer transition-colors duration-300"
            onClick={() => window.open('https://app.dynamic.xyz', '_blank', 'noopener,noreferrer')}
          >
            Get started
          </button>
        </div>
        */}
      </div>
      <LandingHero
        title={t("title")}
        caption={t("caption")}
        tagline={t("tagline")}
        showActions={!isLoggedIn}
        signInLabel={t("signInButton")}
        signUpLabel={t("signUpButton")}
        onSignIn={() => router.push("/sign-in")}
        onSignUp={() => router.push("/sign-up")}
      />
    </div>
  );
}
