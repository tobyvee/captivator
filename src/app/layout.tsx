import type { Metadata } from "next";
import { Inter } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

// Editor chrome only. src/splash/ must never use next/font: exported pages make no external requests.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  fallback: ["system-ui", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Captivator",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" className={inter.variable}>
      <body>{children}</body>
    </html>
  );
}
