import "@/styles/globals.css";

import { type Metadata } from "next";
import { Manrope } from "next/font/google";
import { NuqsAdapter } from "nuqs/adapters/next/app";

import { TRPCReactProvider } from "@/trpc/react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Analytics } from "@vercel/analytics/next";
import { GoogleAnalytics } from "@next/third-parties/google";
import { env } from "@/env";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

export const metadata: Metadata = {
  title: "cur8d.club",
  description: "inspiring designers, builders, and studios.",
  icons: {
    icon: [
      {
        url: "/site-assets/favicon.svg",
        type: "image/svg+xml",
      },
    ],
  },
  openGraph: {
    title: "cur8d.club",
    description: "inspiring designers, builders, and studios.",
    images: [
      {
        url: "/site-assets/ogimage.jpg",
        width: 1200,
        height: 630,
        alt: "cur8d.club",
      },
    ],
    type: "website",
    siteName: "cur8d.club",
  },
  twitter: {
    card: "summary_large_image",
    title: "cur8d.club",
    description: "inspiring designers, builders, and studios.",
    images: ["/site-assets/ogimage.jpg"],
  },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${manrope.className}`}>
      <head>
        <meta
          httpEquiv="Content-Security-Policy"
          content="script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: http:; font-src 'self' https://fonts.gstatic.com data:;"
        />
      </head>
      <body className={`${manrope.className} min-h-screen bg-background`}>
        <NuqsAdapter>
          <TRPCReactProvider>
            <TooltipProvider delayDuration={300}>
              {children}
              <Toaster />
            </TooltipProvider>
          </TRPCReactProvider>
        </NuqsAdapter>
        <Analytics />
        {/* Only mounted where the measurement ID is set, so local dev and
            preview deploys stay out of the production property. */}
        {env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
      </body>
    </html>
  );
}
