"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="data-theme"
      defaultTheme="system"   /* Honour OS preference by default (spec §17.3) */
      enableSystem            /* Enables "system" as a valid theme value */
      enableColorScheme       /* Sets CSS color-scheme — prevents white flash on dark OS */
    >
      {children}
    </NextThemesProvider>
  );
}
