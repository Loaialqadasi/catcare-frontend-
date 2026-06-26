import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CatCare UTM - Campus Cat Management System",
  description: "A comprehensive system for managing campus cats and emergency reports at Universiti Teknologi Malaysia. Track cat health, report emergencies, and coordinate care efforts.",
  keywords: ["CatCare", "UTM", "campus cats", "cat management", "emergency reports", "animal welfare", "university"],
  authors: [{ name: "CatCare UTM Team" }],
  icons: {
    icon: "/logo.svg",
  },
  // MIN-08 Fix: Use PNG for OG image (SVGs not supported by social platforms)
  openGraph: {
    title: "CatCare UTM - Campus Cat Management System",
    description: "A comprehensive system for managing campus cats and emergency reports at Universiti Teknologi Malaysia. Track cat health, report emergencies, and coordinate care efforts.",
    siteName: "CatCare UTM",
    type: "website",
    locale: "en_MY",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "CatCare UTM - Campus Cat Management System",
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // MIN-06 Fix: Removed suppressHydrationWarning — fix the root cause instead
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[9999] focus:px-4 focus:py-2 focus:bg-amber-500 focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold">
          Skip to main content
        </a>
        <div id="main-content">
          {children}
        </div>
        <Toaster position="top-right" richColors closeButton />
      </body>
    </html>
  );
}
