"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, LucideIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

interface MetricCardProps {
  title: string;
  value: number | string;
  icon?: LucideIcon;
  color?: string;
  isLoading?: boolean;
  /** Libellé lu par les lecteurs d'écran (« Voir les œuvres »…). La carte entière devient un lien. */
  buttonTitle?: string;
  buttonRoute?: string;
  /** Rang d'apparition dans la grille : décale l'animation d'entrée */
  index?: number;
}

const COUNT_DURATION_MS = 900;

// Compteur qui monte de 0 à la valeur (easing exponentiel). Sans animation si l'utilisateur
// demande « réduire les animations », ou si la valeur n'est pas un nombre.
function useCountUp(target: number | null, enabled: boolean): number | null {
  const [display, setDisplay] = useState<number | null>(target);
  const frame = useRef(0);

  useEffect(() => {
    if (target === null || !enabled) {
      setDisplay(target);
      return;
    }

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion || target === 0) {
      setDisplay(target);
      return;
    }

    const start = performance.now();
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / COUNT_DURATION_MS);
      const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      setDisplay(Math.round(target * eased));
      if (progress < 1) frame.current = requestAnimationFrame(tick);
    };

    setDisplay(0);
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [target, enabled]);

  return display;
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  color = "var(--color-primary)",
  isLoading,
  buttonTitle,
  buttonRoute,
  index = 0,
}: MetricCardProps) {
  const locale = useLocale();
  const t = useTranslations("dashboard");
  const numericValue = typeof value === "number" ? value : null;
  const counted = useCountUp(numericValue, !isLoading);
  const shown = numericValue !== null ? counted ?? numericValue : value;

  const content = (
    <>
      <div className="metric-card-header">
        {Icon && (
          <div
            className="metric-icon"
            style={{ backgroundColor: "color-mix(in srgb, currentColor 14%, transparent)", color }}
          >
            <Icon size={24} />
          </div>
        )}
        <h4 className="metric-title">{title}</h4>
        {buttonRoute && <ArrowUpRight className="metric-card-arrow" size={18} aria-hidden="true" />}
      </div>
      <div className="metric-value-container" aria-busy={isLoading || undefined}>
        {isLoading ? (
          <div className="metric-loading">
            <div className="metric-loading-bar"></div>
          </div>
        ) : (
          <span className="metric-value" style={{ color }}>
            {typeof shown === "number" ? shown.toLocaleString(locale) : shown}
          </span>
        )}
      </div>
    </>
  );

  const style = { ["--i" as string]: index };

  if (buttonRoute) {
    return (
      <Link
        href={buttonRoute}
        className="metric-card metric-card-link"
        style={style}
        aria-label={`${title} : ${typeof value === "number" ? value.toLocaleString(locale) : value}. ${buttonTitle ?? t("viewDetails")}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <div className="metric-card" style={style}>
      {content}
    </div>
  );
}
