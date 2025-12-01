"use client";

import { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import Button from "../Button/Button";

interface MetricCardProps {
  title: string;
  value: number | string;
  icon?: LucideIcon;
  color?: string;
  isLoading?: boolean;
  buttonTitle?: string;
  buttonRoute?: string;
  isLoadingButton?: boolean;
}

export function MetricCard({
  title,
  value,
  icon: Icon,
  color = "#3b82f6",
  isLoading,
  buttonTitle,
  buttonRoute,
  isLoadingButton = false,
}: MetricCardProps) {
  const router = useRouter();

  const handleButtonClick = () => {
    if (buttonRoute) {
      router.push(buttonRoute);
    }
  };

  return (
    <div className="metric-card">
      <div className="metric-card-header">
        {Icon && (
          <div
            className="metric-icon"
            style={{ backgroundColor: `${color}15`, color }}
          >
            <Icon size={24} />
          </div>
        )}
        <h4 className="metric-title">{title}</h4>
      </div>
      <div className="metric-value-container">
        {isLoading ? (
          <div className="metric-loading">
            <div className="metric-loading-bar"></div>
          </div>
        ) : (
          <span className="metric-value" style={{ color }}>
            {typeof value === "number" ? value.toLocaleString("fr-FR") : value}
          </span>
        )}
      </div>
      {buttonTitle && buttonRoute && (
        <div className="metric-card-button">
          <Button
            onClick={handleButtonClick}
            variant="primary"
            size="small"
            isLoading={isLoadingButton}
            loadingText="Chargement..."
          >
            {buttonTitle}
          </Button>
        </div>
      )}
    </div>
  );
}
