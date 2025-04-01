'use client'

import React from 'react'
import SideMenuItem from './SideMenuItem'
import { useIsAdmin } from '@/app/hooks/useIsAdmin'

interface LandingSubMenuProps {
  isActive: boolean
  isOpen: boolean
  toggleSubmenu: () => void
  onNavigate: (path: string, item: string) => void
  isCollapsed?: boolean
}

export default function LandingSubMenu({ isActive, isOpen, toggleSubmenu, onNavigate, isCollapsed = false }: LandingSubMenuProps) {
  const { isAdmin } = useIsAdmin()

  return (
    <>
      <SideMenuItem
        label="Landing Pages"
        isActive={isActive}
        hasSubmenu={true}
        isSubmenuOpen={isOpen}
        onClick={toggleSubmenu}
        isCollapsed={isCollapsed}
      />

      {isOpen && !isCollapsed && (
        <ul className="submenu">
          <SideMenuItem
            label="Languages"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/languages', 'languages')}
          />
          <SideMenuItem
            label="Translations"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/translations', 'translations')}
          />
          <SideMenuItem
            label="Team"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/team', 'team')}
          />
          <SideMenuItem
            label="FAQ"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/faq', 'faq')}
          />
          <SideMenuItem
            label="FAQ détaillée"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/detailedFaq', 'detailedFaq')}
          />
          <SideMenuItem
            label="Glossaire détaillé"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/detailedGlossary', 'detailedGlossary')}
          />
          <SideMenuItem
            label="Page artistes"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/landingArtists', 'landingArtists')}
          />
          <SideMenuItem
            label="Œuvres en prévente"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/presaleArtworks', 'presaleArtworks')}
          />
        </ul>
      )}

      {isOpen && isCollapsed && (
        <ul className="submenu visible">
          <SideMenuItem
            label="Languages"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/languages', 'languages')}
          />
          <SideMenuItem
            label="Translations"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/translations', 'translations')}
          />
          <SideMenuItem
            label="Team"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/team', 'team')}
          />
          <SideMenuItem
            label="FAQ"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/faq', 'faq')}
          />
          <SideMenuItem
            label="FAQ Détaillées"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/detailedFaq', 'detailedFaq')}
          />
          <SideMenuItem
            label="Glossaire détaillé"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/detailedGlossary', 'detailedGlossary')}
          />
          <SideMenuItem
            label="Page artistes"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/landingArtists', 'landingArtists')}
          />
          <SideMenuItem
            label="Œuvres en prévente"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/presaleArtworks', 'presaleArtworks')}
          />
        </ul>
      )}
    </>
  )
} 