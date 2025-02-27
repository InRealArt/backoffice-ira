import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Providers from "@/lib/providers";
import { Toaster } from 'react-hot-toast';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "InRealArt Backoffice",
  description: "InRealArt Backoffice",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
        <Providers>
          <body className={inter.className}>
            {children}
            <Toaster position="top-right" />
          </body>
        </Providers>
    </html>
  );
}