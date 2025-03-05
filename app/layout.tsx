import type React from "react"
import type { Metadata } from "next"
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

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
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <meta
          httpEquiv="Content-Security-Policy"
          content="script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: http:; font-src 'self' https://fonts.gstatic.com data:;"
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  )
}

