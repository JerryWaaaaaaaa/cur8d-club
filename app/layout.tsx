import type React from "react"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "cur8d.club",
  description: "inspiring designers, builders, and studios.",
  icons: {
    icon: [
      {
        url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/favicon-Qoxp9jTQdr8k3S6LvPjOi225r3y9lY.svg",
        type: "image/svg+xml",
      },
    ],
  },
  openGraph: {
    title: "cur8d.club",
    description: "inspiring designers, builders, and studios.",
    images: [
      {
        url: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ogimage.jpg-VSChKxCSu1KTOW32OEEpXvoUM33DHo.jpeg",
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
    images: ["https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ogimage.jpg-VSChKxCSu1KTOW32OEEpXvoUM33DHo.jpeg"],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

