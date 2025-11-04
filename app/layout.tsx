import "./globals.css";
import "./styles/main.scss";
import type { Metadata } from "next";
import { Bricolage_Grotesque } from "next/font/google";
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import Providers from "@/lib/providers";

const bricolageGrotesque = Bricolage_Grotesque({ 
  subsets: ["latin"],
  variable: "--font-bricolage-grotesque",
});

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
    <html lang="en" className={bricolageGrotesque.variable}>
      <body className={bricolageGrotesque.className}>
        <NuqsAdapter>
          <Providers>
            {children}
          </Providers>
        </NuqsAdapter>
      </body>
    </html>
  );
}