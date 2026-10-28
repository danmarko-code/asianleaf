import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Splash } from "@/components/brand/splash";
import { cn } from "@/lib/utils";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
  weight: ["500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Asian Leaf HOA",
    template: "%s · Asian Leaf HOA",
  },
  description:
    "Homeowners association portal for Asian Leaf, General Trias, Cavite.",
};

export const viewport: Viewport = {
  themeColor: "#f5f8ec",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={cn(inter.variable, playfair.variable)}>
        <noscript>
          <style>{`[data-splash] { display: none !important; }`}</style>
        </noscript>
        <Splash />
        {children}
      </body>
    </html>
  );
}
