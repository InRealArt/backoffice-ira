'use client'

import React from 'react'
import SideMenuItem from './SideMenuItem'
import { useIsAdmin } from '@/app/hooks/useIsAdmin'
import { 
  Globe, 
  Languages, 
  Users, 
  HelpCircle, 
  FileText, 
  BookOpen, 
  ShoppingCart, 
  Folder, 
  Settings,
  Layout
} from 'lucide-react'

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
        icon={<Globe size={20} />}
      />

      {isOpen && !isCollapsed && (
        <ul className="submenu">
          <SideMenuItem
            label="Languages"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/languages', 'languages')}
            icon={<Languages size={18} />}
          />
          <SideMenuItem
            label="Translations"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/translations', 'translations')}
            icon={<FileText size={18} />}
          />
          <SideMenuItem
            label="Team"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/team', 'team')}
            icon={<Users size={18} />}
          />
          <SideMenuItem
            label="FAQ"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/faq', 'faq')}
            icon={<HelpCircle size={18} />}
          />
          <SideMenuItem
            label="FAQ détaillée"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/detailedFaq', 'detailedFaq')}
            icon={<FileText size={18} />}
          />
          <SideMenuItem
            label="FAQ par page"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/detailedFaqPage', 'detailedFaqPage')}
            icon={<BookOpen size={18} />}
          />
          <SideMenuItem
            label="Glossaire détaillé"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/detailedGlossary', 'detailedGlossary')}
            icon={<BookOpen size={18} />}
          />
          <SideMenuItem
            label="Page artistes"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/landingArtists', 'landingArtists')}
            icon={<Users size={18} />}
          />
          <SideMenuItem
            label="Œuvres en prévente"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/presaleArtworks', 'presaleArtworks')}
            icon={<ShoppingCart size={18} />}
          />
          <SideMenuItem
            label="Catégories d'articles de blog"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/blog-categories', 'blog-categories')}
            icon={<Folder size={18} />}
          />
          <SideMenuItem
            label="Articles de blog"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/seo-posts', 'seo-posts')}
            icon={<FileText size={18} />}
          />
          <SideMenuItem
            label="Paramétrage Sticky Footer"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/sticky-footer', 'sticky-footer')}
            icon={<Layout size={18} />}
          />
        </ul>
      )}

      {isOpen && isCollapsed && (
        <ul className="submenu visible">
          <SideMenuItem
            label="Languages"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/languages', 'languages')}
            icon={<Languages size={18} />}
          />
          <SideMenuItem
            label="Translations"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/translations', 'translations')}
            icon={<FileText size={18} />}
          />
          <SideMenuItem
            label="Team"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/team', 'team')}
            icon={<Users size={18} />}
          />
          <SideMenuItem
            label="FAQ"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/faq', 'faq')}
            icon={<HelpCircle size={18} />}
          />
          <SideMenuItem
            label="FAQ détaillée"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/detailedFaq', 'detailedFaq')}
            icon={<FileText size={18} />}
          />
          <SideMenuItem
            label="FAQ par page"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/detailedFaqPage', 'detailedFaqPage')}
            icon={<BookOpen size={18} />}
          />
          <SideMenuItem
            label="Glossaire détaillé"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/detailedGlossary', 'detailedGlossary')}
            icon={<BookOpen size={18} />}
          />
          <SideMenuItem
            label="Page artistes"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/landingArtists', 'landingArtists')}
            icon={<Users size={18} />}
          />
          <SideMenuItem
            label="Œuvres en prévente"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/presaleArtworks', 'presaleArtworks')}
            icon={<ShoppingCart size={18} />}
          />
          <SideMenuItem
            label="Articles de blog"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/blog', 'blog')}
            icon={<FileText size={18} />}
          />
          <SideMenuItem
            label="Catégories d'articles"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/blog-categories', 'blog-categories')}
            icon={<Folder size={18} />}
          />
          <SideMenuItem
            label="Paramétrage Sticky Footer"
            isSubmenuItem={true}
            onClick={() => onNavigate('/landing/sticky-footer', 'sticky-footer')}
            icon={<Layout size={18} />}
          />
        </ul>
      )}
    </>
  )
} 