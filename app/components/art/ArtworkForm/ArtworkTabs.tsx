"use client";

import { useState, useEffect } from "react";
import styles from "./ArtworkTabs.module.scss";

export interface Tab {
  id: string;
  label: string;
  content: React.ReactNode;
  icon?: React.ReactNode;
}

interface ArtworkTabsProps {
  tabs: Tab[];
  defaultTabId?: string;
  className?: string;
  activeTabId?: string;
  onTabChange?: (tabId: string) => void;
}

export default function ArtworkTabs({
  tabs,
  defaultTabId,
  className = "",
  activeTabId: externalActiveTabId,
  onTabChange,
}: ArtworkTabsProps) {
  const [internalActiveTabId, setInternalActiveTabId] = useState(
    defaultTabId || tabs[0]?.id
  );

  // Utiliser l'onglet externe s'il est fourni, sinon utiliser l'état interne
  const activeTabId = externalActiveTabId ?? internalActiveTabId;

  // Mettre à jour l'état interne si l'onglet externe change
  useEffect(() => {
    if (externalActiveTabId) {
      setInternalActiveTabId(externalActiveTabId);
    }
  }, [externalActiveTabId]);

  const handleTabChange = (tabId: string) => {
    setInternalActiveTabId(tabId);
    onTabChange?.(tabId);
  };

  const activeTab = tabs.find((tab) => tab.id === activeTabId);

  if (!tabs || tabs.length === 0) {
    return null;
  }

  return (
    <div className={`${styles.tabs} ${className}`}>
      <div className={styles.list}>
        <nav className={styles.nav} role="tablist" aria-label="Onglets du formulaire">
          {tabs.map((tab) => {
            const isActive = activeTabId === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`tab-${tab.id}`}
                onClick={() => handleTabChange(tab.id)}
                className={`${styles.tab} ${isActive ? styles.tabActive : ""}`}
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      <div className={styles.panel}>
        {activeTab && (
          <div
            id={`tabpanel-${activeTabId}`}
            role="tabpanel"
            aria-labelledby={`tab-${activeTabId}`}
            className="w-full opacity-0 animate-fadeIn"
            key={activeTabId}
          >
            {activeTab.content || null}
          </div>
        )}
      </div>
    </div>
  );
}
