
'use client';

import { DynamicWidget } from '@dynamic-labs/sdk-react-core';
import { useState, useEffect } from 'react';
import DynamicMethods from "@/app/components/Methods";
import './page.css';
import Navbar from './components/Navbar/Navbar';

const checkIsDarkSchemePreferred = () => {
  if (typeof window !== 'undefined') {
    return window.matchMedia?.('(prefers-color-scheme:dark)')?.matches ?? false;
  }
  return false;
};

export default function Main() {
  const [isDarkMode, setIsDarkMode] = useState(checkIsDarkSchemePreferred);

  useEffect(() => {
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => setIsDarkMode(checkIsDarkSchemePreferred());
    
    darkModeMediaQuery.addEventListener('change', handleChange);
    return () => darkModeMediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <div className={`container ${isDarkMode ? 'dark' : 'light'}`}>
      <Navbar />
      <div className="header">
        {/*
        <img className="logo" src={isDarkMode ? "/logo-light.png" : "/logo-dark.png"} alt="dynamic" />
        <div className="header-buttons">
          <button className="docs-button" onClick={() => window.open('https://docs.dynamic.xyz', '_blank', 'noopener,noreferrer')}>Docs</button>
          <button className="get-started" onClick={() => window.open('https://app.dynamic.xyz', '_blank', 'noopener,noreferrer')}>Get started</button>
        </div>
        */}
      </div>
      <div className="modal">
      <h1 className="welcome-title">Welcome to InRealArt backoffice</h1>
        
        
      </div>
    </div> 
  );
}
