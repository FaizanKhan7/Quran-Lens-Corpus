import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Amiri } from "next/font/google";
import { GeistMono } from "geist/font/mono";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const amiri = Amiri({
  variable: "--font-amiri",
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  display: "swap",
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
      <body className="min-h-dvh flex flex-col bg-[var(--color-bg)] text-[var(--color-fg)]">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
