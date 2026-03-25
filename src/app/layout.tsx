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
  metadataBase: new URL("https://smart-campus-assistant.vercel.app"),
  title: {
    default: "بوابة معهد طيبة العالي | Smart Campus Assistant",
    template: "%s | معهد طيبة العالي",
  },
  description:
    "النظام الذكي لإدارة الحضور والغياب والمواد الدراسية لطلاب وأعضاء هيئة التدريس في معهد طيبة العالي (Thebes Academy).",
  keywords: [
    "معهد طيبة",
    "معهد طيبة العالي",
    "موقع معهد طيبة",
    "بوابة معهد طيبة الدخول",
    "نتائج معهد طيبة",
    "غياب معهد طيبة",
    "جدول محاضرات معهد طيبة",
    "Thebes Academy",
    "Thebes Academy Portal",
    "Smart Campus Assistant",
    "نظام الحضور والغياب معهد طيبة",
    "المنصة التعليمية لمعهد طيبة",
    "Thebes Higher Institute",
    "موقع معهد طيبة الرسمي",
    "طيبة اكاديمي",
    "أكاديمية طيبة التعليمية",
  ],
  authors: [{ name: "Smart Campus Team" }],
  robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  alternates: {
    canonical: "/",
  },
  verification: {
    google: "UtiHpKBI6P-nUzjNeELS3KM4EH8HU5Mi4QQJMQvag-o",
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon.png' }
    ],
  },
  openGraph: {
    type: "website",
    locale: "ar_EG",
    url: "https://smart-campus-assistant.vercel.app",
    title: "بوابة معهد طيبة العالي | Smart Campus Assistant",
    description:
      "النظام الذكي لإدارة الحضور والغياب والمواد الدراسية لطلاب وأعضاء هيئة التدريس في معهد طيبة العالي.",
    siteName: "معهد طيبة العالي - Smart Campus",
  },
  twitter: {
    card: "summary_large_image",
    title: "بوابة معهد طيبة العالي | Smart Campus Assistant",
    description:
      "النظام الذكي لإدارة الحضور والغياب والمواد الدراسية في معهد طيبة العالي.",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
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
    url: "https://smart-campus-assistant.vercel.app",
    logo: "https://smart-campus-assistant.vercel.app/icon.png",
    description: "مؤسسة تعليمية رائدة تقدم برامج أكاديمية متنوعة. نظام الحضور والغياب الذكي للطلاب وأعضاء هيئة التدريس.",
    sameAs: [
      "https://thebesacademy.edu.eg/" // Main original site if applicable
    ]
  };

  return (
    <html lang="ar" dir="ltr">
      <head>
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
