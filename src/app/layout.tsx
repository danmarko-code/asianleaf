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
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f8ec" },
    { media: "(prefers-color-scheme: dark)", color: "#0f140b" },
  ],
  width: "device-width",
  initialScale: 1,
};

const themeScript = `(function(){try{var t=localStorage.getItem("asialeaf-theme");var d=t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
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
