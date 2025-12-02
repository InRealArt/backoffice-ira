"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Button from "@/app/components/Button/Button";

interface NavigationButtonProps {
  href: string;
  variant?: "primary" | "secondary" | "danger" | "success";
  className?: string;
  children: React.ReactNode;
}

export default function NavigationButton({
  href,
  variant = "primary",
  className,
  children,
}: NavigationButtonProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(false);

  // Réinitialiser le loading quand la navigation est terminée
  useEffect(() => {
    if (isLoading && pathname === href) {
      setIsLoading(false);
    }
  }, [pathname, href, isLoading]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsLoading(true);
    router.push(href);

    // Fallback: réinitialiser après un délai maximum si la navigation échoue
    setTimeout(() => {
      setIsLoading(false);
    }, 2000);
  };

  return (
    <Button
      variant={variant}
      className={className}
      isLoading={isLoading}
      onClick={handleClick}
    >
      {children}
    </Button>
  );
}





