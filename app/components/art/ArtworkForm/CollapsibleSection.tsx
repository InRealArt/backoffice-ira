"use client";

import { useId, useState } from "react";
import { ChevronDown } from "lucide-react";
import styles from "./CollapsibleSection.module.scss";

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  className?: string;
  /** Conservé pour compatibilité : toutes les sections partagent désormais le même style */
  bgVariant?:
    | "default"
    | "subtle-1"
    | "subtle-2"
    | "subtle-3"
    | "subtle-4"
    | "subtle-5";
}

export default function CollapsibleSection({
  title,
  children,
  defaultExpanded = true,
  className = "",
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const bodyId = useId();

  return (
    <div className={`${styles.section} ${className}`}>
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className={styles.header}
        aria-expanded={isExpanded}
        aria-controls={bodyId}
      >
        <h3 className={styles.title}>{title}</h3>
        <ChevronDown
          className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ""}`}
          aria-hidden="true"
        />
      </button>
      <div id={bodyId} className={`${styles.body} ${isExpanded ? styles.bodyOpen : ""}`}>
        <div className={styles.content}>{children}</div>
      </div>
    </div>
  );
}
