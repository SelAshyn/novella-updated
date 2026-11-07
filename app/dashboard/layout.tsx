import type { Metadata } from "next";
import { IBM_Plex_Mono, Instrument_Serif, Literata } from "next/font/google";


import { AppShell } from "@/components/dashboard/app-shell";

import { ProtectedRoute } from "@/components/dashboard/protected-route";

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-plex-mono",
});

const instrumentSerif = Instrument_Serif({
  subsets: ["latin"],
  weight: ["400"],
  variable: "--font-instrument-serif",
});

const literata = Literata({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-literata",
});

export const metadata: Metadata = {
  title: "Novella",
  description: "A reading notebook that remembers for you.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`${ibmPlexMono.variable} ${instrumentSerif.variable} ${literata.variable}`}>
      <ProtectedRoute>
        <AppShell>{children}</AppShell>
      </ProtectedRoute>
    </div>
  );
}
