"use client";

import { useState, useEffect } from "react";

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
    <div className={`w-full ${className}`}>
      {/* En-tête des onglets avec design élégant */}
      <div className="border-b-2 border-gray-200 dark:border-gray-700 mb-8 pl-6 sm:pl-8 md:pl-10">
        <nav
          className="flex space-x-0.5 overflow-x-auto scrollbar-hide"
          aria-label="Onglets du formulaire"
        >
          {tabs.map((tab) => {
            const isActive = activeTabId === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTabChange(tab.id)}
                className={`
                  relative px-6 py-4 text-sm font-semibold transition-all duration-300 ease-in-out
                  whitespace-nowrap flex items-center gap-2.5
                  border-b-2 border-transparent
                  rounded-t-lg
                  ${
                    isActive
                      ? "text-primary dark:text-primary border-b-2 border-primary dark:border-primary bg-gradient-to-b from-primary/5 to-transparent dark:from-primary/10 dark:to-transparent shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  }
                `}
                aria-selected={isActive}
                aria-controls={`tabpanel-${tab.id}`}
                role="tab"
              >
                {tab.icon && (
                  <span
                    className={`
                    transition-all duration-300
                    ${
                      isActive
                        ? "text-primary dark:text-primary scale-110"
                        : "text-gray-400 dark:text-gray-500"
                    }
                  `}
                  >
                    {tab.icon}
                  </span>
                )}
                <span className="relative z-10">{tab.label}</span>
                {isActive && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-primary to-primary dark:from-primary dark:via-primary dark:to-primary"
                    aria-hidden="true"
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Contenu de l'onglet actif avec animation */}
      <div className="relative w-full">
        {activeTab && (
          <div
            id={`tabpanel-${activeTabId}`}
            role="tabpanel"
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
