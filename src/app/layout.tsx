import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  weight: ["400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const SITE_URL = "https://game.givefreely.org";
const TITLE = "The Great Controversy";
const DESC = "A Last Day ADVENTure Game — hidden role social deduction for 5-15 players. Bible-themed Avalon-style game with missionary stories, scripture, and free play during Sabbath hours.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: TITLE,
  description: DESC,
  applicationName: TITLE,
  keywords: [
    "social deduction game",
    "Avalon",
    "Adventist game",
    "Christian game",
    "Bible game",
    "youth group game",
    "hidden role game",
    "missionary game",
    "Sabbath",
  ],
  openGraph: {
    type: "website",
    siteName: TITLE,
    title: TITLE,
    description: DESC,
    url: SITE_URL,
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: TITLE,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESC,
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`h-full antialiased ${playfair.variable} ${inter.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
