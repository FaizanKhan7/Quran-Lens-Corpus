import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Amiri } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import { FontWatcher } from "@/components/providers/FontWatcher";
import { PwaInit } from "@/components/providers/PwaInit";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { OfflineBanner } from "@/components/ui/OfflineBanner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

// Amiri: the critical Arabic font for all Quranic text (spec §8.4).
// Rules:
//   - weight 400 only — we NEVER bold Arabic (spec §8.4)
//   - display "swap" — show fallback immediately; swap when Amiri loads (FOUT > blank text)
//   - adjustFontFallback: true — next/font injects size-adjust on the fallback serif
//     so glyphs are the same cap-height → near-zero CLS when the real font arrives
//   - fallback: ["serif"] — tells next/font which system font to size-adjust against
const amiri = Amiri({
  variable: "--font-amiri",
  subsets: ["arabic", "latin"],
  weight: ["400"],
  display: "swap",
  preload: true,
  adjustFontFallback: true,
  fallback: ["serif"],
});

export const metadata: Metadata = {
  title: {
    default: "Quran Lens",
    template: "%s | Quran Lens",
  },
  description:
    "A modern linguistic exploration platform for the Quran — word-by-word morphology, root analysis, and syntactic treebank.",
  keywords: ["Quran", "Arabic", "morphology", "corpus", "treebank", "linguistics"],
  authors: [{ name: "Quran Lens" }],
  metadataBase: new URL("https://quran-lens.app"),
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Quran Lens",
    statusBarStyle: "default",
  },
  openGraph: {
    title: "Quran Lens",
    description:
      "Explore the Quran word by word — morphology, roots, grammar, and more.",
    type: "website",
    locale: "ar_SA",
    alternateLocale: ["en_US"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      suppressHydrationWarning
      className={`${inter.variable} ${amiri.variable} ${GeistMono.variable} h-full antialiased`}
    >
      <body className="min-h-dvh flex flex-col bg-surface text-text-primary">
        <ThemeProvider>
          <AuthProvider>
            <PwaInit />
            <OfflineBanner />
            <FontWatcher />
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
