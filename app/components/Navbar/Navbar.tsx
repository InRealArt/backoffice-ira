'use client'

import { ThemeToggle } from '../ThemeToggle/ThemeToggle'
import NavbarMenu from './NavbarMenu'
import UserProfile from './UserProfile'
import LanguageSwitcher from '../LanguageSwitcher'
import BrandLogo from '@/app/components/BrandLogo/BrandLogo'

export default function Navbar() {

  return (
    <div 
      className="navbar fixed top-0 w-full z-50 border-b border-border backdrop-blur-md bg-white/95 transition-all duration-300 font-sans" 
      style={{ padding: '0 32px', height: '90px' }}
    >
      <div className="navbar-start">
        <NavbarMenu />
        <div className="flex items-center gap-3">
          <BrandLogo size="md" caption="Backoffice" />
        </div>
      </div>
      
      <div className="navbar-end">
        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          <ThemeToggle />
          <UserProfile />
        </div>
      </div>
    </div>
  )
}