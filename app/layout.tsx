import "./globals.css";
import "./styles/main.scss";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import Providers from "@/lib/providers";

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
      <body className={inter.className}>
        <NuqsAdapter>
          <Providers>
            {children}
          </Providers>
        </NuqsAdapter>
      </body>
    </html>
  );
}