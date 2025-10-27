'use client'

import Image from 'next/image'
import { ThemeToggle } from '../ThemeToggle/ThemeToggle'

export default function Navbar() {

  return (
    <div 
      className="navbar fixed top-0 w-full z-50 shadow-lg backdrop-blur-md bg-white/95 dark:bg-gray-900/95 transition-all duration-300 font-sans" 
      style={{ padding: '0 32px', height: '90px' }}
    >
      <div className="flex-1">
        <div className="flex items-center gap-3">
          <div className="bg-black rounded-md p-1 flex items-center justify-center w-[70px] h-[70px]">
            <Image
              src="/img/Logo_InRealArt.svg"
              alt="InRealArt Logo"
              width={60}
              height={60}
              className="logo-image"
            />
          </div>
          <span className="text-xl font-semibold text-gray-900 dark:text-white">InRealArt backoffice</span>
        </div>
      </div>
      
      <div className="flex-none">
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </div>
  )
}