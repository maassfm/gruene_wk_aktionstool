import type { Metadata, Viewport } from "next";
import { districtConfig } from "@/lib/district-config";
import Providers from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: `Wahlkampfaktionen – ${districtConfig.orgShortName}`,
  description:
    `Koordination von Wahlkampfaktionen für ${districtConfig.orgFullName}`,
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <head />
      <body className="font-sans antialiased bg-white text-black">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
