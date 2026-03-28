import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import Script from "next/script";
import "./globals.css";

const GA_ID = "G-VVQ3GHYPY5";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://video-to-text.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Video2Text - AI Video Transcription & Frame Analysis",
    template: "%s | Video2Text",
  },
  description:
    "Free AI-powered tool to extract speech transcription and visual content from YouTube videos. Uses Groq Whisper & Llama Vision.",
  keywords: [
    "video to text",
    "youtube transcription",
    "speech to text",
    "video transcription",
    "frame analysis",
    "AI video",
    "whisper",
    "free transcription",
    "video OCR",
  ],
  authors: [{ name: "JYTech" }],
  creator: "JYTech",
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: "zh_CN",
    url: siteUrl,
    siteName: "Video2Text",
    title: "Video2Text - AI Video Transcription & Frame Analysis",
    description:
      "Free AI-powered tool to extract speech and visual content from videos into text.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Video2Text - AI Video Transcription & Frame Analysis",
    description:
      "Free AI-powered tool to extract speech and visual content from videos into text.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    languages: {
      en: "/en",
      zh: "/zh",
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <head>
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}');
          `}
        </Script>
      </head>
      <body className="min-h-full flex flex-col bg-[#0a0a0f] text-white">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
