/**
 * Root layout for the Anchor application.
 *
 * This is the top-level Next.js layout that wraps every page. It:
 * - Loads the Inter font and exposes it via the `--font-inter` CSS variable
 * - Sets global SEO metadata (title & description)
 * - Renders the `AppShell` component which provides sidebar + mobile navigation
 *
 * @see {@link globals.css} for theme tokens and FullCalendar style overrides
 * @see {@link @/components/app-shell} for the shell layout (sidebar, mobile nav, content area)
 */

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/app-shell";
import { SessionProvider } from "@/components/auth/session-provider";
import { AthleteProvider } from "@/components/auth/athlete-context";

/** Load the Inter font from Google Fonts with the Latin subset. */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

/** Page metadata used by Next.js for SEO and browser tab titles. */
export const metadata: Metadata = {
  title: "Anchor - Sports Psychology Client App",
  description:
    "A mental and physical wellbeing tracking platform for sports psychologists and their clients",
};

/**
 * RootLayout - wraps every route with the global font, styles, and app shell.
 *
 * @param children - The page content rendered by the current route.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <SessionProvider>
          <AthleteProvider>
            <AppShell>{children}</AppShell>
          </AthleteProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
