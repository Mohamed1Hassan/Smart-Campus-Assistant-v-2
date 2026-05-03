import React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import ClientProviders from "../components/ClientProviders";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://thebes-academy-portal.vercel.app"),
  title: {
    default: "بوابة معهد طيبة العالي الذكية | Smart Campus Assistant",
    template: "%s | معهد طيبة العالي",
  },
  description:
    "المنصة الذكية المتكاملة لمعهد طيبة العالي (Thebes Academy). نظام متطور لإدارة الحضور بالبصمة الحيوية، مساعد أكاديمي مدعوم بالذكاء الاصطناعي، وإدارة شاملة للمواد والاختبارات.",
  keywords: [
    "معهد طيبة",
    "معهد طيبة العالي",
    "بوابة الطالب معهد طيبة",
    "Thebes Academy",
    "Smart Campus Assistant",
    "نظام الحضور الذكي",
    "ذكاء اصطناعي أكاديمي",
    "Thebes Higher Institute",
    "تسجيل الحضور بالوجه",
    "منصة معهد طيبة التعليمية",
  ],
  authors: [{ name: "Smart Campus Team" }],
  applicationName: "Smart Campus Assistant",
  generator: "Next.js",
  referrer: "origin-when-cross-origin",
  robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  alternates: {
    canonical: "/",
  },
  verification: {
    google: "UtiHpKBI6P-nUzjNeELS3KM4EH8HU5Mi4QQJMQvag-o",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
      { url: "/icon.png", type: "image/png", sizes: "192x192" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/icon.png", color: "#2563eb" },
    ],
  },
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "ar_EG",
    url: "https://thebes-academy-portal.vercel.app",
    title: "بوابة معهد طيبة العالي الذكية | Smart Campus Assistant",
    description:
      "اختبر مستقبل التعليم في معهد طيبة العالي. نظام ذكي لإدارة الحضور، مساعد AI، وتقارير أكاديمية فورية.",
    siteName: "Smart Campus Assistant",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Smart Campus Assistant - The Future of Education",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "بوابة معهد طيبة العالي الذكية | Smart Campus Assistant",
    description:
      "النظام الذكي المتكامل لإدارة الحضور والعملية التعليمية في معهد طيبة العالي.",
    images: ["/og-image.png"],
  },
  category: "education",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2563eb",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    name: "معهد طيبة العالي - Thebes Academy",
    alternateName: ["معهد طيبة", "Thebes Higher Institute", "أكاديمية طيبة"],
    url: "https://thebes-academy-portal.vercel.app",
    logo: "https://thebes-academy-portal.vercel.app/smart-campus-logo.png",
    image: "https://thebes-academy-portal.vercel.app/og-image.png",
    description: "مؤسسة تعليمية رائدة تقدم برامج أكاديمية متنوعة. نظام الحضور والغياب الذكي للطلاب وأعضاء هيئة التدريس.",
    address: {
      "@type": "PostalAddress",
      addressCountry: "EG",
    },
    sameAs: [
      "https://thebesacademy.edu.eg/"
    ]
  };

  return (
    <html lang="ar" dir="rtl" className="scroll-smooth" data-scroll-behavior="smooth">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
