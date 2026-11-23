"use client";

import { authClient } from "@/lib/auth-client";
import { useTranslations } from "next-intl";
import { useSessionRole } from "@/app/hooks/useSessionRole";
import { Badge } from "@/app/components/PageLayout";
import { User, LogOut, UserCircle } from "lucide-react";

export default function UserProfile() {
  const t = useTranslations("user");
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;
  const isLoggedIn = !!session;
  const { role: userRole } = useSessionRole();

  const handleSignOut = async () => {
    await authClient.signOut();
  };

  // Fonction pour déterminer le variant du badge selon le rôle
  const getRoleBadgeVariant = (
    role: string | null | undefined
  ): "success" | "info" | "secondary" => {
    if (!role) return "secondary";

    const roleLC = role.toLowerCase();

    switch (roleLC) {
      case "admin":
      case "administrateur":
        return "success";
      case "artist":
      case "artiste":
        return "info";
      case "gallerymanager":
      case "gallery manager":
        return "info";
      default:
        return "secondary";
    }
  };

  // Fonction pour obtenir le texte du rôle traduit
  const getRoleText = (role: string | null | undefined): string => {
    if (!role) return t("roles.user");

    const roleLC = role.toLowerCase();

    switch (roleLC) {
      case "admin":
      case "administrateur":
        return t("roles.admin");
      case "artist":
      case "artiste":
        return t("roles.artist");
      case "gallerymanager":
      case "gallery manager":
        return t("roles.galleryManager");
      default:
        return t("roles.user");
    }
  };

  if (!isLoggedIn || !user || isPending) {
    return null;
  }

  return (
    <div className="dropdown dropdown-end">
      <div
        tabIndex={0}
        role="button"
        aria-label={t("accountMenu")}
        className="btn btn-ghost btn-circle avatar"
      >
        <div className="w-10 rounded-full bg-neutral text-neutral-content flex items-center justify-center">
          <UserCircle className="w-6 h-6" />
        </div>
      </div>
      <ul
        tabIndex={0}
        className="menu menu-sm dropdown-content bg-background-white dark:bg-background-white backdrop-blur-md rounded-box z-[1] mt-3 w-52 p-2 shadow-2xl border-2 border-border dark:border-border"
      >
        <li className="menu-title p-0">
          <div className="flex items-center justify-between px-3 py-2 font-semibold text-base-content">
            <span className="flex items-center gap-2">
              <User className="w-4 h-4" aria-hidden="true" />
              {t("profile")}
            </span>
            <Badge
              variant={getRoleBadgeVariant(userRole)}
              text={getRoleText(userRole)}
              size="small"
            />
          </div>
        </li>
        <li className="divider my-0" role="separator"></li>
        <li className="menu-title p-0">
          <div
            className="px-3 py-2 text-xs font-normal normal-case text-base-content/70 truncate"
            title={user?.email}
          >
            {user?.email}
          </div>
        </li>
        <li className="divider my-0" role="separator"></li>
        <li>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-error hover:bg-error/10"
          >
            <LogOut className="w-4 h-4" aria-hidden="true" />
            {t("signOut")}
          </button>
        </li>
      </ul>
    </div>
  );
}
